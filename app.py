from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Sample data
DESIGNERS_DATA = [
    {
        "id": 1,
        "name": "Sarah Johnson",
        "title": "Senior Interior Designer",
        "location": "Mumbai, India",
        "description": "Specializing in modern residential spaces with a focus on sustainable materials and smart home integration.",
        "tags": ["Modern", "Sustainable", "Smart Homes"],
        "rating": 4.8,
        "projects": 127,
        "clients": 89,
        "price": "₹2,500",
        "priceUnit": "per sq ft",
        "avatar": "SJ",
        "portfolio": [
            "https://example.com/portfolio1.jpg",
            "https://example.com/portfolio2.jpg"
        ],
        "contact": {
            "email": "sarah.johnson@example.com",
            "phone": "+91-9876543210"
        },
        "created_at": "2024-01-15T10:30:00Z",
        "is_active": True
    },
    {
        "id": 2,
        "name": "Rajesh Patel",
        "title": "Luxury Space Designer",
        "location": "Delhi, India",
        "description": "Expert in creating luxurious commercial and residential spaces with attention to detail and premium finishes.",
        "tags": ["Luxury", "Commercial", "Premium"],
        "rating": 4.9,
        "projects": 203,
        "clients": 156,
        "price": "₹3,800",
        "priceUnit": "per sq ft",
        "avatar": "RP",
        "portfolio": [
            "https://example.com/portfolio3.jpg",
            "https://example.com/portfolio4.jpg"
        ],
        "contact": {
            "email": "rajesh.patel@example.com",
            "phone": "+91-9876543211"
        },
        "created_at": "2024-01-10T14:20:00Z",
        "is_active": True
    },
    {
        "id": 3,
        "name": "Priya Sharma",
        "title": "Minimalist Design Expert",
        "location": "Bangalore, India",
        "description": "Creating clean, functional spaces that maximize natural light and promote wellness through thoughtful design.",
        "tags": ["Minimalist", "Wellness", "Natural Light"],
        "rating": 4.7,
        "projects": 98,
        "clients": 67,
        "price": "₹2,200",
        "priceUnit": "per sq ft",
        "avatar": "PS",
        "portfolio": [
            "https://example.com/portfolio5.jpg",
            "https://example.com/portfolio6.jpg"
        ],
        "contact": {
            "email": "priya.sharma@example.com",
            "phone": "+91-9876543212"
        },
        "created_at": "2024-01-20T09:15:00Z",
        "is_active": True
    },
    {
        "id": 4,
        "name": "Arjun Menon",
        "title": "Traditional Architect",
        "location": "Kochi, India",
        "description": "Blending traditional Indian architecture with contemporary functionality for timeless living spaces.",
        "tags": ["Traditional", "Architecture", "Cultural"],
        "rating": 4.6,
        "projects": 156,
        "clients": 112,
        "price": "₹2,800",
        "priceUnit": "per sq ft",
        "avatar": "AM",
        "portfolio": [
            "https://example.com/portfolio7.jpg",
            "https://example.com/portfolio8.jpg"
        ],
        "contact": {
            "email": "arjun.menon@example.com",
            "phone": "+91-9876543213"
        },
        "created_at": "2024-01-05T16:45:00Z",
        "is_active": True
    },
    {
        "id": 5,
        "name": "Kavya Reddy",
        "title": "Sustainable Designer",
        "location": "Hyderabad, India",
        "description": "Passionate about eco-friendly designs using recycled materials and energy-efficient solutions.",
        "tags": ["Sustainable", "Eco-friendly", "Energy Efficient"],
        "rating": 4.8,
        "projects": 134,
        "clients": 98,
        "price": "₹2,600",
        "priceUnit": "per sq ft",
        "avatar": "KR",
        "portfolio": [
            "https://example.com/portfolio9.jpg",
            "https://example.com/portfolio10.jpg"
        ],
        "contact": {
            "email": "kavya.reddy@example.com",
            "phone": "+91-9876543214"
        },
        "created_at": "2024-01-12T11:30:00Z",
        "is_active": True
    }
]

# In-memory storage for shortlisted items (in production, use a database)
SHORTLISTED_ITEMS = {}

@app.route('/')
def home():
    """Home route - API status"""
    return jsonify({
        "message": "EmptyCup Interior Designers API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": [
            "GET /api/designers",
            "GET /api/designers/<id>",
            "POST /api/designers/search",
            "POST /api/shortlist",
            "GET /api/shortlist/<user_id>",
            "GET /api/stats"
        ],
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/designers', methods=['GET'])
def get_designers():
    """Get all interior designers with optional filtering"""
    try:
        # Get query parameters for filtering
        search = request.args.get('search', '').lower()
        location = request.args.get('location', '').lower()
        tag = request.args.get('tag', '').lower()
        min_rating = request.args.get('min_rating', type=float)
        max_price = request.args.get('max_price', type=int)
        sort_by = request.args.get('sort_by', 'name')  # name, rating, price, projects
        sort_order = request.args.get('sort_order', 'asc')  # asc, desc
        
        designers = [d for d in DESIGNERS_DATA if d['is_active']]
        
        # Apply filters
        if search:
            designers = [d for d in designers if 
                        search in d['name'].lower() or 
                        search in d['title'].lower() or 
                        search in d['description'].lower() or
                        any(search in tag.lower() for tag in d['tags'])]
        
        if location:
            designers = [d for d in designers if location in d['location'].lower()]
        
        if tag:
            designers = [d for d in designers if any(tag in t.lower() for t in d['tags'])]
        
        if min_rating:
            designers = [d for d in designers if d['rating'] >= min_rating]
        
        if max_price:
            # Extract numeric value from price string (₹2,500 -> 2500)
            designers = [d for d in designers if 
                        int(d['price'].replace('₹', '').replace(',', '')) <= max_price]
        
        # Apply sorting
        reverse = sort_order.lower() == 'desc'
        if sort_by == 'rating':
            designers.sort(key=lambda x: x['rating'], reverse=reverse)
        elif sort_by == 'price':
            designers.sort(key=lambda x: int(x['price'].replace('₹', '').replace(',', '')), reverse=reverse)
        elif sort_by == 'projects':
            designers.sort(key=lambda x: x['projects'], reverse=reverse)
        else:  # default to name
            designers.sort(key=lambda x: x['name'].lower(), reverse=reverse)
        
        return jsonify({
            "success": True,
            "data": designers,
            "count": len(designers),
            "filters_applied": {
                "search": search if search else None,
                "location": location if location else None,
                "tag": tag if tag else None,
                "min_rating": min_rating,
                "max_price": max_price,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/designers/<int:designer_id>', methods=['GET'])
def get_designer(designer_id):
    """Get a specific designer by ID"""
    try:
        designer = next((d for d in DESIGNERS_DATA if d['id'] == designer_id and d['is_active']), None)
        
        if not designer:
            return jsonify({
                "success": False,
                "error": "Designer not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": designer
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/designers/search', methods=['POST'])
def search_designers():
    """Advanced search for designers"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No search criteria provided"
            }), 400
        
        designers = [d for d in DESIGNERS_DATA if d['is_active']]
        
        # Apply search criteria
        if 'keywords' in data and data['keywords']:
            keywords = data['keywords'].lower()
            designers = [d for d in designers if 
                        keywords in d['name'].lower() or 
                        keywords in d['title'].lower() or 
                        keywords in d['description'].lower()]
        
        if 'tags' in data and data['tags']:
            required_tags = [tag.lower() for tag in data['tags']]
            designers = [d for d in designers if 
                        any(req_tag in [t.lower() for t in d['tags']] for req_tag in required_tags)]
        
        if 'location' in data and data['location']:
            location = data['location'].lower()
            designers = [d for d in designers if location in d['location'].lower()]
        
        if 'min_rating' in data and data['min_rating']:
            designers = [d for d in designers if d['rating'] >= data['min_rating']]
        
        if 'price_range' in data and data['price_range']:
            min_price = data['price_range'].get('min', 0)
            max_price = data['price_range'].get('max', float('inf'))
            designers = [d for d in designers if 
                        min_price <= int(d['price'].replace('₹', '').replace(',', '')) <= max_price]
        
        return jsonify({
            "success": True,
            "data": designers,
            "count": len(designers),
            "search_criteria": data
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/shortlist', methods=['POST'])
def manage_shortlist():
    """Add or remove designer from shortlist"""
    try:
        data = request.get_json()
        
        if not data or 'designer_id' not in data:
            return jsonify({
                "success": False,
                "error": "Designer ID is required"
            }), 400
        
        designer_id = data['designer_id']
        action = data.get('action', 'add')  # 'add' or 'remove'
        user_id = data.get('user_id', 'default_user')  # In production, get from auth
        
        # Check if designer exists
        designer = next((d for d in DESIGNERS_DATA if d['id'] == designer_id), None)
        if not designer:
            return jsonify({
                "success": False,
                "error": "Designer not found"
            }), 404
        
        # Initialize user shortlist if not exists
        if user_id not in SHORTLISTED_ITEMS:
            SHORTLISTED_ITEMS[user_id] = set()
        
        # Perform action
        if action == 'add':
            SHORTLISTED_ITEMS[user_id].add(designer_id)
            message = "Designer added to shortlist"
        elif action == 'remove':
            SHORTLISTED_ITEMS[user_id].discard(designer_id)
            message = "Designer removed from shortlist"
        else:
            return jsonify({
                "success": False,
                "error": "Invalid action. Use 'add' or 'remove'"
            }), 400
        
        return jsonify({
            "success": True,
            "message": message,
            "designer_id": designer_id,
            "user_id": user_id,
            "shortlisted_count": len(SHORTLISTED_ITEMS[user_id])
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/shortlist/<user_id>', methods=['GET'])
def get_shortlist(user_id):
    """Get shortlisted designers for a user"""
    try:
        if user_id not in SHORTLISTED_ITEMS:
            return jsonify({
                "success": True,
                "data": [],
                "count": 0
            })
        
        shortlisted_ids = SHORTLISTED_ITEMS[user_id]
        shortlisted_designers = [d for d in DESIGNERS_DATA if d['id'] in shortlisted_ids and d['is_active']]
        
        return jsonify({
            "success": True,
            "data": shortlisted_designers,
            "count": len(shortlisted_designers),
            "user_id": user_id
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get platform statistics"""
    try:
        active_designers = [d for d in DESIGNERS_DATA if d['is_active']]
        total_designers = len(active_designers)
        
        # Calculate average rating
        avg_rating = sum(d['rating'] for d in active_designers) / total_designers if total_designers > 0 else 0
        
        # Calculate total projects and clients
        total_projects = sum(d['projects'] for d in active_designers)
        total_clients = sum(d['clients'] for d in active_designers)
        
        # Get location distribution
        locations = {}
        for designer in active_designers:
            location = designer['location'].split(',')[-1].strip()  # Get city
            locations[location] = locations.get(location, 0) + 1
        
        # Get tag distribution
        tags = {}
        for designer in active_designers:
            for tag in designer['tags']:
                tags[tag] = tags.get(tag, 0) + 1
        
        # Get price range
        prices = [int(d['price'].replace('₹', '').replace(',', '')) for d in active_designers]
        price_stats = {
            "min": min(prices) if prices else 0,
            "max": max(prices) if prices else 0,
            "avg": sum(prices) / len(prices) if prices else 0
        }
        
        return jsonify({
            "success": True,
            "data": {
                "total_designers": total_designers,
                "average_rating": round(avg_rating, 2),
                "total_projects": total_projects,
                "total_clients": total_clients,
                "location_distribution": locations,
                "tag_distribution": tags,
                "price_statistics": price_stats,
                "total_shortlists": sum(len(shortlist) for shortlist in SHORTLISTED_ITEMS.values())
            }
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/tags', methods=['GET'])
def get_tags():
    """Get all available tags"""
    try:
        all_tags = set()
        for designer in DESIGNERS_DATA:
            if designer['is_active']:
                all_tags.update(designer['tags'])
        
        return jsonify({
            "success": True,
            "data": sorted(list(all_tags))
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all available locations"""
    try:
        locations = set()
        for designer in DESIGNERS_DATA:
            if designer['is_active']:
                locations.add(designer['location'])
        
        return jsonify({
            "success": True,
            "data": sorted(list(locations))
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "success": False,
        "error": "Method not allowed"
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)