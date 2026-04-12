#!/usr/bin/env python3
import snscrape.modules.twitter as sntwitter
import json

try:
    print("🔍 Testing snscrape for #NagrikConnect...")
    
    tweets = []
    query = "#NagrikConnect"
    
    for i, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
        if i >= 5:  # Get only 5 tweets
            break
        
        tweets.append({
            'id': tweet.id,
            'text': tweet.rawContent,
            'username': tweet.user.username,
            'date': str(tweet.date)
        })
        
    if len(tweets) > 0:
        print(f"✅ Found {len(tweets)} tweets!")
        for tweet in tweets:
            print(f"\n@{tweet['username']}: {tweet['text'][:100]}...")
    else:
        print("📭 No tweets found with #NagrikConnect")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nℹ️  snscrape is broken for Twitter since 2023")
    print("ℹ️  Twitter requires login to view tweets now")
