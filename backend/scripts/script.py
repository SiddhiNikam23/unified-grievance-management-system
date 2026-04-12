import requests
import pandas as pd
import time
import os

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

def scrape_twitter_grievances(keywords, count=10):
    grievance_data = []
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    for keyword in keywords:
        print(f"Fetching tweets for: {keyword}")
        driver.get(f"https://twitter.com/search?q={keyword}&src=typed_query")
        time.sleep(5)
        tweets = driver.find_elements(By.XPATH, '//div[@data-testid="tweetText"]')
        
        for tweet in tweets[:count]:
            grievance_data.append([keyword, tweet.text])
        
        time.sleep(2)
    
    driver.quit()
    return grievance_data

govt_keywords = [
    "Water Crisis", "Railway Problems", "Electricity Issues",
    "Bad Roads", "Public Transport", "Municipal Complaints"
]

grievances = scrape_twitter_grievances(govt_keywords, count=10)

df = pd.DataFrame(grievances, columns=["Category", "Tweet"])

df.to_csv("government_grievances_twitter.csv", index=False)

print("✅ Government grievance data saved as government_grievances_twitter.csv")
