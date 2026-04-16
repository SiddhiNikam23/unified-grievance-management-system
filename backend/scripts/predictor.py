from __future__ import annotations

from datetime import date, datetime
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd


MODEL_FILES = {
    "type_model": "type_model.pkl",
    "volume_model": "volume_model.pkl",
    "le_type": "le_type.pkl",
    "le_location": "le_location.pkl",
    "le_loc2": "le_loc2.pkl",
    "le_type2": "le_type2.pkl",
    "tfidf": "tfidf.pkl",
    "time_series_data": "time_series_data.pkl",
    "df_clean": "df_clean.pkl",
}

LOCATION_COORDINATES = {
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "nagpur": (21.1458, 79.0882),
    "nashik": (19.9975, 73.7898),
    "thane": (19.2183, 72.9781),
    "aurangabad": (19.8762, 75.3433),
    "solapur": (17.6599, 75.9064),
    "kolhapur": (16.7050, 74.2433),
    "amravati": (20.9374, 77.7796),
    "satara": (17.6805, 74.0183),
}


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        number = float(value)
        if np.isnan(number) or np.isinf(number):
            return default
        return number
    except Exception:
        return default


def _normalize_location(value: Any) -> str:
    if value is None:
        return "Unknown"
    text = str(value).strip()
    return text if text else "Unknown"


class FutureComplaintPredictor:
    def __init__(self) -> None:
        self.base_dir = Path(__file__).resolve().parent
        self.search_directories = self._candidate_directories()
        self.artifact_paths: Dict[str, Optional[str]] = {}
        self.artifacts = self._load_artifacts()

        self.df_clean = self._ensure_dataframe(self.artifacts.get("df_clean"))
        self.time_series_data = self._ensure_dataframe(self.artifacts.get("time_series_data"))

        self.location_col = self._find_column(self.df_clean, ["location", "district", "city", "area", "state"])
        self.type_col = self._find_column(
            self.df_clean,
            ["complaint_type", "type", "category", "grievance_type", "issue_type"],
        )
        self.date_col = self._find_column(
            self.df_clean,
            ["created_at", "date", "date_of_receipt", "timestamp", "complaint_date"],
        )
        self.lat_col = self._find_column(self.df_clean, ["latitude", "lat"])
        self.lng_col = self._find_column(self.df_clean, ["longitude", "lng", "lon"])

        self.location_profiles = self._build_location_profiles()
        self.available_locations = self._get_available_locations()

    def _candidate_directories(self) -> List[Path]:
        configured_model_dir = os.getenv("FUTURE_MODELS_DIR") or os.getenv("PREDICTION_MODELS_DIR")

        directories: List[Path] = []
        if configured_model_dir:
            configured_path = Path(configured_model_dir)
            if not configured_path.is_absolute():
                configured_path = (self.base_dir / configured_path).resolve()
            directories.append(configured_path)

        directories.extend(
            [
                self.base_dir / "models",
                self.base_dir / "trained_models",
                self.base_dir.parent / "models",
                self.base_dir,
            ]
        )

        deduped: List[Path] = []
        for directory in directories:
            if directory not in deduped:
                deduped.append(directory)

        return deduped

    def _load_artifacts(self) -> Dict[str, Any]:
        artifacts: Dict[str, Any] = {}
        for key, filename in MODEL_FILES.items():
            artifacts[key] = None
            self.artifact_paths[key] = None
            for directory in self.search_directories:
                file_path = directory / filename
                if file_path.exists():
                    try:
                        artifacts[key] = joblib.load(file_path)
                        self.artifact_paths[key] = str(file_path)
                    except Exception:
                        artifacts[key] = None
                        self.artifact_paths[key] = str(file_path)
                    break
        return artifacts

    def _ensure_dataframe(self, value: Any) -> pd.DataFrame:
        if isinstance(value, pd.DataFrame):
            return value.copy()
        if isinstance(value, list):
            try:
                return pd.DataFrame(value)
            except Exception:
                return pd.DataFrame()
        return pd.DataFrame()

    def _find_column(self, frame: pd.DataFrame, candidates: List[str]) -> Optional[str]:
        if frame.empty:
            return None

        lower_to_actual = {str(col).lower(): col for col in frame.columns}
        for candidate in candidates:
            if candidate in lower_to_actual:
                return lower_to_actual[candidate]
        return None

    def _build_location_profiles(self) -> Dict[str, Dict[str, Any]]:
        profiles: Dict[str, Dict[str, Any]] = {}
        if self.df_clean.empty or not self.location_col:
            return profiles

        df = self.df_clean.copy()
        df[self.location_col] = df[self.location_col].apply(_normalize_location)

        if self.date_col and self.date_col in df.columns:
            df[self.date_col] = pd.to_datetime(df[self.date_col], errors="coerce")

        for location, group in df.groupby(self.location_col):
            location_name = _normalize_location(location)
            avg_daily = max(1.0, float(len(group)) / max(1, group[self.date_col].dt.date.nunique() if self.date_col and self.date_col in group else 30))

            top_type = "General"
            if self.type_col and self.type_col in group.columns:
                type_counts = group[self.type_col].astype(str).value_counts()
                if not type_counts.empty:
                    top_type = str(type_counts.index[0])

            latitude = None
            longitude = None
            if self.lat_col and self.lng_col and self.lat_col in group and self.lng_col in group:
                lat_series = pd.to_numeric(group[self.lat_col], errors="coerce").dropna()
                lng_series = pd.to_numeric(group[self.lng_col], errors="coerce").dropna()
                if not lat_series.empty and not lng_series.empty:
                    latitude = float(lat_series.mean())
                    longitude = float(lng_series.mean())

            profiles[location_name] = {
                "avg_daily": avg_daily,
                "top_type": top_type,
                "latitude": latitude,
                "longitude": longitude,
            }

        return profiles

    def _get_available_locations(self) -> List[str]:
        from_data = sorted([loc for loc in self.location_profiles.keys() if loc and loc != "Unknown"])
        if from_data:
            return from_data

        encoder = self.artifacts.get("le_location")
        if encoder is not None and hasattr(encoder, "classes_"):
            classes = [str(item) for item in list(getattr(encoder, "classes_", []))]
            classes = [item for item in classes if item and item.lower() != "unknown"]
            if classes:
                return sorted(classes)

        return ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"]

    def _try_predict_with_model(self, model: Any, candidates: List[np.ndarray], default: float) -> float:
        if model is None:
            return default

        n_features = getattr(model, "n_features_in_", None)

        for candidate in candidates:
            try:
                if n_features and candidate.shape[1] != int(n_features):
                    continue
                value = model.predict(candidate)
                if isinstance(value, (list, tuple, np.ndarray)):
                    return _safe_float(value[0], default)
                return _safe_float(value, default)
            except Exception:
                continue

        return default

    def _encode_location(self, location: str) -> float:
        for encoder_key in ["le_location", "le_loc2"]:
            encoder = self.artifacts.get(encoder_key)
            if encoder is not None and hasattr(encoder, "transform"):
                try:
                    return _safe_float(encoder.transform([location])[0], 0.0)
                except Exception:
                    continue
        return 0.0

    def _predict_volume(self, location: str, target: date) -> float:
        profile = self.location_profiles.get(location, {})
        baseline = _safe_float(profile.get("avg_daily"), 2.0)

        today = date.today()
        day_delta = max(0, (target - today).days)
        weekday = float(target.weekday())
        month = float(target.month)
        loc_encoded = self._encode_location(location)

        seasonality = 1.05 if target.weekday() in (0, 1) else 0.95
        heuristic = max(1.0, baseline * seasonality * (1.0 + min(day_delta, 30) * 0.003))

        candidates = [
            np.array([[loc_encoded]], dtype=float),
            np.array([[loc_encoded, weekday]], dtype=float),
            np.array([[loc_encoded, weekday, month]], dtype=float),
            np.array([[loc_encoded, weekday, month, float(day_delta)]], dtype=float),
            np.array([[weekday, month, float(day_delta)]], dtype=float),
        ]

        predicted = self._try_predict_with_model(self.artifacts.get("volume_model"), candidates, heuristic)
        return max(1.0, round(predicted, 2))

    def _predict_type(self, location: str, target: date) -> str:
        profile = self.location_profiles.get(location, {})
        fallback = str(profile.get("top_type", "General"))

        type_model = self.artifacts.get("type_model")
        tfidf = self.artifacts.get("tfidf")

        if type_model is not None and tfidf is not None and hasattr(tfidf, "transform"):
            text = f"{location} grievance trend forecast for {target.strftime('%A')} month {target.month}"
            try:
                vector = tfidf.transform([text])
                prediction = type_model.predict(vector)
                if isinstance(prediction, (list, tuple, np.ndarray)):
                    raw = prediction[0]
                else:
                    raw = prediction

                if isinstance(raw, (int, np.integer, float, np.floating)):
                    for encoder_key in ["le_type", "le_type2"]:
                        encoder = self.artifacts.get(encoder_key)
                        if encoder is not None and hasattr(encoder, "inverse_transform"):
                            try:
                                return str(encoder.inverse_transform([int(raw)])[0])
                            except Exception:
                                continue
                return str(raw)
            except Exception:
                pass

        if type_model is not None:
            loc_encoded = self._encode_location(location)
            candidates = [
                np.array([[loc_encoded]], dtype=float),
                np.array([[loc_encoded, float(target.weekday())]], dtype=float),
                np.array([[loc_encoded, float(target.weekday()), float(target.month)]], dtype=float),
            ]
            for candidate in candidates:
                try:
                    prediction = type_model.predict(candidate)
                    raw = prediction[0] if isinstance(prediction, (list, tuple, np.ndarray)) else prediction
                    if isinstance(raw, (int, np.integer, float, np.floating)):
                        for encoder_key in ["le_type", "le_type2"]:
                            encoder = self.artifacts.get(encoder_key)
                            if encoder is not None and hasattr(encoder, "inverse_transform"):
                                try:
                                    return str(encoder.inverse_transform([int(raw)])[0])
                                except Exception:
                                    continue
                    return str(raw)
                except Exception:
                    continue

        return fallback

    def _location_coordinates(self, location: str) -> Tuple[Optional[float], Optional[float]]:
        profile = self.location_profiles.get(location, {})
        latitude = profile.get("latitude")
        longitude = profile.get("longitude")
        if isinstance(latitude, (int, float)) and isinstance(longitude, (int, float)):
            return float(latitude), float(longitude)

        key = location.strip().lower()
        if key in LOCATION_COORDINATES:
            return LOCATION_COORDINATES[key]

        return None, None

    def _recommended_actions(self, complaint_type: str, urgency: str) -> List[str]:
        type_value = complaint_type.lower()
        actions: List[str] = []

        if "water" in type_value:
            actions.extend([
                "Pre-position water tanker routes for affected zones",
                "Inspect pumping stations and backup supply readiness",
            ])
        elif "electric" in type_value or "power" in type_value:
            actions.extend([
                "Deploy preventive inspection teams to high-load feeders",
                "Keep rapid-repair electrical crew on standby",
            ])
        elif "road" in type_value or "traffic" in type_value:
            actions.extend([
                "Increase road maintenance checks in projected hotspots",
                "Coordinate diversion and signal timing with traffic control",
            ])
        else:
            actions.extend([
                "Assign additional complaint triage staff for projected surge",
                "Prepare targeted citizen communication for likely issue category",
            ])

        if urgency == "HIGH":
            actions.append("Activate emergency escalation protocol and 24x7 monitoring")

        return actions

    def predict_future(self, target_date: str) -> Dict[str, Any]:
        try:
            parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError("Invalid date format. Use YYYY-MM-DD.") from exc

        if not self.available_locations:
            return {
                "target_date": target_date,
                "high_risk_areas": [],
                "predictions": [],
                "preventive_action_alerts": [],
            }

        predictions: List[Dict[str, Any]] = []
        for location in self.available_locations:
            predicted_volume = self._predict_volume(location, parsed_date)
            complaint_type = self._predict_type(location, parsed_date)
            latitude, longitude = self._location_coordinates(location)

            predictions.append(
                {
                    "location": location,
                    "complaint_type": complaint_type,
                    "predicted_volume": float(round(predicted_volume, 2)),
                    "latitude": latitude,
                    "longitude": longitude,
                }
            )

        predictions.sort(key=lambda item: item["predicted_volume"], reverse=True)

        volumes = [item["predicted_volume"] for item in predictions]
        if volumes:
            threshold = float(np.percentile(volumes, 75))
        else:
            threshold = 0.0

        alerts: List[Dict[str, Any]] = []
        for item in predictions:
            urgency = "HIGH" if item["predicted_volume"] >= max(5.0, threshold) else "MEDIUM"
            item["urgency"] = urgency

            alert = {
                "location": item["location"],
                "urgency": urgency,
                "predicted_volume": item["predicted_volume"],
                "complaint_type": item["complaint_type"],
                "recommended_actions": self._recommended_actions(item["complaint_type"], urgency),
            }
            alerts.append(alert)

        high_risk = [
            {
                "location": item["location"],
                "predicted_volume": item["predicted_volume"],
                "complaint_type": item["complaint_type"],
                "urgency": item["urgency"],
            }
            for item in predictions
            if item["urgency"] == "HIGH"
        ]

        return {
            "target_date": target_date,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "high_risk_areas": high_risk,
            "predictions": predictions,
            "preventive_action_alerts": alerts,
            "artifacts_loaded": {
                key: self.artifacts.get(key) is not None
                for key in MODEL_FILES.keys()
            },
        }


_predictor = FutureComplaintPredictor()


def predict_future(target_date: str) -> Dict[str, Any]:
    return _predictor.predict_future(target_date)


def predictor_health() -> Dict[str, Any]:
    return {
        "locations": len(_predictor.available_locations),
        "search_directories": [str(path) for path in _predictor.search_directories],
        "artifacts_loaded": {
            key: _predictor.artifacts.get(key) is not None
            for key in MODEL_FILES.keys()
        },
        "artifact_paths": _predictor.artifact_paths,
    }
