const { Scraper, Cookie } = require('@the-convocation/twitter-scraper');
const Grievance = require('../models/grievance');
const { detectGrievancePriority } = require('./gemini');

let scraper = null;
let processedTweetIds = new Set();

// Extract department from tweet text
function extractDepartmentFromTweet(tweetText) {
    const lowerText = tweetText.toLowerCase();
    
    if (lowerText.includes('electricity') || lowerText.includes('power') || lowerText.includes('bijli') || lowerText.includes('बिजली')) {
        return {
            department: "Housing and Urban Affairs",
            category: "utilities",
            subcategory: "electricity"
        };
    }
    if (lowerText.includes('water') || lowerText.includes('pani') || lowerText.includes('पानी')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "water_supply"
        };
    }
    if (lowerText.includes('road') || lowerText.includes('pothole') || lowerText.includes('सड़क')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "roads"
        };
    }
    if (lowerText.includes('garbage') || lowerText.includes('waste') || lowerText.includes('trash') || lowerText.includes('कचरा')) {
        return {
            department: "Housing and Urban Affairs",
            category: "health_sanitation",
            subcategory: "waste_management"
        };
    }
    if (lowerText.includes('street light') || lowerText.includes('streetlight') || lowerText.includes('lamp')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "street_lights"
        };
    }
    if (lowerText.includes('police') || lowerText.includes('crime') || lowerText.includes('theft')) {
        return {
            department: "Law & Order",
            category: "law_order",
            subcategory: "police_complaint"
        };
    }
    if (lowerText.includes('hospital') || lowerText.includes('health') || lowerText.includes('medical')) {
        return {
            department: "Health & Family Welfare",
            category: "health_sanitation",
            subcategory: "hospital_services"
        };
    }
    
    return {
        department: "General",
        category: "General",
        subcategory: "Other"
    };
}

// Process a tweet and create grievance
async function processTweet(tweet) {
    try {
        // Check if already processed
        if (processedTweetIds.has(tweet.id)) {
            return null;
        }
        
        // Check if tweet contains NagrikConnect or mentions @NagrikConnet
        const hasKeyword = tweet.text.toLowerCase().includes('nagrikconnect') || 
                          tweet.text.toLowerCase().includes('#nagrikconnect') ||
                          tweet.text.toLowerCase().includes('@nagrikconnet') ||
                          tweet.username.toLowerCase() === 'nagrikconnet';
        
        if (!hasKeyword) {
            return null;
        }
        
        console.log(`\n📨 Processing tweet from @${tweet.username}`);
        console.log(`Tweet: ${tweet.text}`);
        
        // Check if already in database
        const existingGrievance = await Grievance.findOne({
            'sourceMetadata.twitterTweetId': tweet.id
        });
        
        if (existingGrievance) {
            console.log('⏭️  Tweet already processed in database');
            processedTweetIds.add(tweet.id);
            return null;
        }
        
        // Extract department and category (simple keyword matching, no AI)
        const { department, category, subcategory } = extractDepartmentFromTweet(tweet.text);
        
        // Simple priority detection without AI
        const lowerText = tweet.text.toLowerCase();
        let priority = 'Medium';
        let priorityReason = 'Standard complaint from Twitter';
        
        if (lowerText.includes('urgent') || lowerText.includes('emergency') || lowerText.includes('critical')) {
            priority = 'High';
            priorityReason = 'Marked as urgent in tweet';
        } else if (lowerText.includes('unsafe') || lowerText.includes('danger') || lowerText.includes('accident')) {
            priority = 'High';
            priorityReason = 'Safety concern mentioned';
        }
        
        // Create grievance
        const grievance = new Grievance({
            complainantName: `@${tweet.username}`,
            complainantEmail: `${tweet.username}@twitter.com`,
            department: department,
            category: category,
            subcategory: subcategory,
            description: tweet.text,
            location: null,
            priority: priority,
            priorityReason: priorityReason,
            source: 'twitter',
            sourceMetadata: {
                twitterTweetId: tweet.id,
                twitterHandle: `@${tweet.username}`,
                twitterMediaUrls: tweet.photos || []
            }
        });
        
        const savedGrievance = await grievance.save();
        console.log(`✅ Created grievance: ${savedGrievance.grievanceCode}`);
        
        // Mark as processed
        processedTweetIds.add(tweet.id);
        
        return savedGrievance;
        
    } catch (error) {
        console.error('❌ Error processing tweet:', error.message);
        return null;
    }
}

// Initialize scraper with optional cookie authentication
async function initializeScraper() {
    if (!scraper) {
        scraper = new Scraper();
        
        // Try to login with cookies if provided in environment
        if (process.env.TWITTER_COOKIES) {
            try {
                console.log('🔐 Attempting to authenticate with cookies...');
                
                // Parse cookies from environment variable
                const cookieString = process.env.TWITTER_COOKIES;
                const cookieArray = [];
                
                // Split by semicolon and parse each cookie
                cookieString.split(';').forEach(cookie => {
                    const trimmed = cookie.trim();
                    const [name, ...valueParts] = trimmed.split('=');
                    const value = valueParts.join('='); // Handle values with = in them
                    
                    if (name && value) {
                        // Create cookie strings for both twitter.com and x.com domains
                        const cookieStrTwitter = `${name.trim()}=${value.trim()}; Domain=.twitter.com; Path=/; Secure; HttpOnly; SameSite=None`;
                        const cookieStrX = `${name.trim()}=${value.trim()}; Domain=.x.com; Path=/; Secure; HttpOnly; SameSite=None`;
                        cookieArray.push(cookieStrTwitter);
                        cookieArray.push(cookieStrX);
                    }
                });
                
                console.log(`📝 Parsed ${cookieArray.length} cookie entries (for both domains)`);
                
                // Set cookies as strings (the library will parse them)
                await scraper.setCookies(cookieArray);
                
                const isLoggedIn = await scraper.isLoggedIn();
                
                if (isLoggedIn) {
                    console.log('✅ Twitter scraper authenticated successfully');
                    return scraper;
                } else {
                    console.log('⚠️  Cookie authentication failed - not logged in');
                    console.log('   This might be because:');
                    console.log('   1. Cookies are expired or invalid');
                    console.log('   2. Account is suspended/restricted');
                    console.log('   3. Additional cookies are needed');
                }
            } catch (error) {
                console.log('⚠️  Cookie authentication error:', error.message);
            }
        }
        
        console.log('ℹ️  Continuing without authentication (limited functionality)');
    }
    return scraper;
}

// Search for tweets with hashtag or mentions, and also check profile
async function searchTweets(searchQuery = '#NagrikConnect OR @NagrikConnet OR NagrikConnect', maxTweets = 20) {
    try {
        await initializeScraper();
        
        console.log(`🔍 Searching for: ${searchQuery}...`);
        
        const tweets = [];
        const tweetIds = new Set(); // Prevent duplicates
        
        // Method 1: Search query
        try {
            const searchIterator = scraper.searchTweets(searchQuery, maxTweets);
            
            for await (const tweet of searchIterator) {
                if (tweets.length >= maxTweets) break;
                if (!tweetIds.has(tweet.id)) {
                    tweets.push({
                        id: tweet.id,
                        text: tweet.text,
                        username: tweet.username,
                        photos: tweet.photos || [],
                        createdAt: tweet.timeParsed
                    });
                    tweetIds.add(tweet.id);
                }
            }
        } catch (error) {
            console.log(`⚠️  Search query failed: ${error.message}`);
        }
        
        // Method 2: Check @NagrikConnet profile directly
        try {
            console.log(`🔍 Also checking @NagrikConnet profile...`);
            const profileIterator = scraper.getTweets('NagrikConnet', 10);
            
            for await (const tweet of profileIterator) {
                if (tweets.length >= maxTweets) break;
                if (!tweetIds.has(tweet.id)) {
                    tweets.push({
                        id: tweet.id,
                        text: tweet.text,
                        username: tweet.username,
                        photos: tweet.photos || [],
                        createdAt: tweet.timeParsed
                    });
                    tweetIds.add(tweet.id);
                }
            }
        } catch (error) {
            console.log(`⚠️  Profile check failed: ${error.message}`);
        }
        
        console.log(`✅ Found ${tweets.length} tweets total`);
        return tweets;
        
    } catch (error) {
        console.error(`❌ Error searching tweets: ${error.message}`);
        return [];
    }
}

// Start polling for tweets
function startTwitterPolling(intervalMinutes = 2, searchQuery = '#NagrikConnect OR @NagrikConnet OR NagrikConnect') {
    console.log(`\n🐦 Starting REAL Twitter scraping (every ${intervalMinutes} minutes)...`);
    console.log(`📡 Monitoring: ${searchQuery}`);
    console.log(`🔧 Using @the-convocation/twitter-scraper library\n`);
    
    const intervalMs = intervalMinutes * 60 * 1000;
    
    const pollInterval = setInterval(async () => {
        try {
            console.log(`\n🔍 Checking for new tweets... (${new Date().toLocaleTimeString()})`);
            
            const tweets = await searchTweets(searchQuery, 20);
            
            if (tweets.length === 0) {
                console.log('📭 No tweets found');
                return;
            }
            
            let processedCount = 0;
            for (const tweet of tweets) {
                const result = await processTweet(tweet);
                if (result) {
                    processedCount++;
                }
            }
            
            if (processedCount > 0) {
                console.log(`✅ Processed ${processedCount} new complaint(s)`);
            } else {
                console.log('📭 No new complaints to process');
            }
            
        } catch (error) {
            console.error('Error in polling cycle:', error.message);
        }
    }, intervalMs);
    
    // Initial check after 5 seconds
    setTimeout(async () => {
        console.log('🔍 Running initial tweet check...');
        try {
            const tweets = await searchTweets(searchQuery, 20);
            if (tweets.length > 0) {
                console.log(`📬 Found ${tweets.length} tweet(s) in initial check`);
                console.log('📝 Sample tweets:');
                tweets.slice(0, 3).forEach(t => {
                    console.log(`   @${t.username}: ${t.text.substring(0, 60)}...`);
                });
                console.log('');
                
                for (const tweet of tweets) {
                    await processTweet(tweet);
                }
            } else {
                console.log('📭 No tweets found in initial check');
            }
        } catch (error) {
            console.error('Error in initial check:', error.message);
        }
    }, 5000);
    
    return pollInterval;
}

module.exports = {
    startTwitterPolling,
    searchTweets,
    processTweet,
    initializeScraper
};
