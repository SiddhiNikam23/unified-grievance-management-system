import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCcw, Send, Link as LinkIcon } from 'lucide-react';

const initialForm = {
  sourcePlatform: 'x',
  sourceHandle: '',
  sourceAuthorName: '',
  sourcePostUrl: '',
  sourceContent: '',
  sourceLanguage: 'en'
};

const DEPARTMENT_LABELS = {
  emergency_response: 'Emergency Response Team',
  financial_services: 'Financial Services (Banking Division)',
  labour_employment: 'Labour and Employment',
  income_tax: 'Central Board of Direct Taxes (Income Tax)',
  posts: 'Posts',
  telecommunications: 'Telecommunications',
  personnel_training: 'Personnel and Training',
  housing_urban: 'Housing and Urban Affairs',
  health_welfare: 'Health & Family Welfare'
};

const DEPARTMENT_KEYWORDS = {
  financial_services: ['bank', 'atm', 'loan', 'credit', 'debit', 'upi', 'payment', 'refund', 'account', 'card', 'fraud'],
  labour_employment: ['labour', 'employment', 'salary', 'wage', 'job', 'pf', 'epf', 'gratuity', 'workplace', 'contract'],
  income_tax: ['income tax', 'tax', 'itr', 'refund', 'pan', 'notice', 'assessment', 'tds'],
  posts: ['post', 'postal', 'courier', 'parcel', 'speed post', 'delivery', 'mail', 'tracking'],
  telecommunications: ['telecom', 'telecommunications', 'network', 'internet', 'mobile', 'signal', 'broadband', 'call', 'tower', 'sim', 'wifi', 'data'],
  personnel_training: ['recruitment', 'transfer', 'promotion', 'training', 'service matter', 'cadre', 'posting', 'appointment'],
  housing_urban: ['water', 'electric', 'electricity', 'power', 'road', 'traffic', 'sanitation', 'waste', 'garbage', 'sewer', 'drain', 'pothole', 'street', 'housing', 'urban', 'municipal'],
  health_welfare: ['hospital', 'doctor', 'medicine', 'health', 'treatment', 'ambulance', 'clinic', 'welfare', 'patient']
};

function normalizeDepartment(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s\-/]+/g, '_');
}

function resolveDepartmentKey(value) {
  const normalized = normalizeDepartment(value);
  if (!normalized) return '';
  if (DEPARTMENT_LABELS[normalized]) return normalized;

  const aliases = {
    telecommunication: 'telecommunications',
    telecom: 'telecommunications',
    housing: 'housing_urban',
    urban: 'housing_urban',
    electricity: 'housing_urban',
    water: 'housing_urban',
    road: 'housing_urban',
    postal: 'posts',
    post: 'posts',
    bank: 'financial_services',
    banking: 'financial_services',
    labour: 'labour_employment',
    employment: 'labour_employment',
    income: 'income_tax',
    tax: 'income_tax',
    health: 'health_welfare',
    welfare: 'health_welfare'
  };

  return aliases[normalized] || normalized;
}

function complaintMatchesDepartment(complaint, departmentKey) {
  if (!departmentKey || departmentKey === 'emergency_response') return true;

  const explicitDepartment = resolveDepartmentKey(
    complaint.department || complaint.departmentLabel || complaint.assignedDepartment || complaint.department_name || ''
  );
  if (explicitDepartment && explicitDepartment === departmentKey) {
    return true;
  }

  const text = [
    complaint.sourceContent,
    complaint.sourcePlatform,
    complaint.sourceHandle,
    complaint.sourceAuthorName,
    complaint.department,
    complaint.category,
    complaint.issue_type
  ]
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const keywords = DEPARTMENT_KEYWORDS[departmentKey] || [];
  return keywords.some((keyword) => text.includes(keyword));
}

const SocialComplaints = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [adminDepartment, setAdminDepartment] = useState('');

  useEffect(() => {
    setAdminDepartment(localStorage.getItem('adminDepartment') || '');
  }, []);

  const effectiveDepartment = useMemo(
    () => resolveDepartmentKey(adminDepartment || localStorage.getItem('adminDepartment') || ''),
    [adminDepartment]
  );

  const departmentLabel = DEPARTMENT_LABELS[effectiveDepartment] || 'Your Department';

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/social-complaints?limit=50', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to load social complaints');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredItems = useMemo(
    () => items.filter((item) => complaintMatchesDepartment(item, effectiveDepartment)),
    [items, effectiveDepartment]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/social-complaints/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to intake social complaint');
      }

      setForm(initialForm);
      setMessage('Social post analyzed and added to review queue.');
      await fetchItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (id) => {
    setImportingId(id);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/social-complaints/${id}/import`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to import complaint');
      }

      const payload = await response.json();
      setMessage(`Imported as grievance ${payload.grievance?.grievanceCode || ''}`);
      await fetchItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setImportingId(null);
    }
  };

  const stats = {
    total: filteredItems.length,
    verified: filteredItems.filter((item) => item.isComplaint).length,
    imported: filteredItems.filter((item) => item.status === 'Imported').length,
    rejected: filteredItems.filter((item) => item.status === 'Rejected').length
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={34} />
          Social Complaint Listener
        </h1>
        <p className="text-gray-600 mt-2">
          Detect complaints from social media posts, verify them, and route the approved ones into the grievance system.
        </p>
        <p className="text-sm text-gray-500 mt-1">Showing complaints for: {departmentLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          ['Total Posts', stats.total],
          ['Verified Complaints', stats.verified],
          ['Imported to Grievance', stats.imported],
          ['Rejected', stats.rejected]
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add Social Post</h2>
            <p className="text-sm text-gray-600">Paste a tweet/post to verify it and send to the grievance system.</p>
          </div>
          <button
            type="button"
            onClick={fetchItems}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            name="sourcePlatform"
            value={form.sourcePlatform}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="x">X / Twitter</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="reddit">Reddit</option>
            <option value="other">Other</option>
          </select>
          <input
            name="sourceHandle"
            value={form.sourceHandle}
            onChange={handleChange}
            placeholder="Handle / username"
            className="border rounded-lg px-3 py-2"
          />
          <input
            name="sourceAuthorName"
            value={form.sourceAuthorName}
            onChange={handleChange}
            placeholder="Author name"
            className="border rounded-lg px-3 py-2"
          />
          <input
            name="sourcePostUrl"
            value={form.sourcePostUrl}
            onChange={handleChange}
            placeholder="Post URL"
            className="border rounded-lg px-3 py-2"
          />
          <select
            name="sourceLanguage"
            value={form.sourceLanguage}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="bn">Bengali</option>
            <option value="gu">Gujarati</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
            <option value="pa">Punjabi</option>
          </select>
          <textarea
            name="sourceContent"
            value={form.sourceContent}
            onChange={handleChange}
            placeholder="Paste the social media complaint here"
            className="border rounded-lg px-3 py-2 md:col-span-2 min-h-[120px]"
          />
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              <Send size={16} /> {submitting ? 'Analyzing...' : 'Verify and Queue'}
            </button>
          </div>
        </form>
      </div>

      {(message || error) && (
        <div className={`mb-6 rounded-lg px-4 py-3 ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {error || message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Review Queue</h2>
            <p className="text-sm text-gray-600">Verified posts can be imported to the grievance platform.</p>
          </div>
          <div className="text-sm text-gray-500">Auto refresh every 30 seconds</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading social complaints...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No social complaints detected yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Platform</th>
                  <th className="px-4 py-3 text-left">Handle</th>
                  <th className="px-4 py-3 text-left">Complaint</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Verification</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{item.sourcePlatform}</td>
                    <td className="px-4 py-3">{item.sourceHandle || 'Anonymous'}</td>
                    <td className="px-4 py-3 max-w-[360px]">
                      <div className="font-medium text-gray-800 line-clamp-2">{item.sourceContent}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <LinkIcon size={12} /> {item.sourcePostUrl || 'No URL'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        {item.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.verificationScore || 0}%
                      <div className="text-xs mt-1">{item.verificationReason || 'Pending review'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'Imported' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle2 size={12} /> Imported
                        </span>
                      ) : item.isComplaint ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Verified</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Rejected</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.isComplaint && !item.grievanceCreated ? (
                        <button
                          type="button"
                          onClick={() => handleImport(item._id)}
                          disabled={importingId === item._id}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {importingId === item._id ? 'Importing...' : 'Import to Grievance'}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialComplaints;
