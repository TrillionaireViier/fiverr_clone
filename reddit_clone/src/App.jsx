import React, { useState } from 'react';
import { 
  Search, 
  Star, 
  Briefcase, 
  CheckCircle, 
  Heart, 
  Share2, 
  Plus, 
  Filter, 
  Globe, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  TrendingUp, 
  Award, 
  ChevronRight,
  UserCheck,
  DollarSign
} from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Gig Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Graphics & Design');
  const [newPrice, setNewPrice] = useState(50);
  const [newSeller, setNewSeller] = useState('pro_freelancer');
  const [newDelivery, setNewDelivery] = useState('2 days');

  const categories = [
    'All',
    'Graphics & Design',
    'Programming & Tech',
    'Digital Marketing',
    'Video & Animation',
    'AI Services',
    'Writing & Translation'
  ];

  const [gigs, setGigs] = useState([
    {
      id: 1,
      seller: 'alex_design',
      sellerLevel: 'Top Rated Seller',
      sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'I will create a modern 3D UI UX design for your web or mobile application',
      category: 'Graphics & Design',
      rating: 4.9,
      reviewsCount: 342,
      price: 120,
      deliveryTime: '2 days',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      pro: true
    },
    {
      id: 2,
      seller: 'dev_master_ai',
      sellerLevel: 'Level 2 Seller',
      sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'I will develop fullstack React NextJS web apps with AI integration',
      category: 'Programming & Tech',
      rating: 5.0,
      reviewsCount: 189,
      price: 250,
      deliveryTime: '3 days',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      pro: true
    },
    {
      id: 3,
      seller: 'seo_ninja',
      sellerLevel: 'Level 1 Seller',
      sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      title: 'I will boost your Google ranking with high DA authority backlinks',
      category: 'Digital Marketing',
      rating: 4.8,
      reviewsCount: 512,
      price: 85,
      deliveryTime: '1 day',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      pro: false
    },
    {
      id: 4,
      seller: 'ai_prompt_craft',
      sellerLevel: 'Top Rated Seller',
      sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'I will train custom Midjourney LLM AI models and generate concept art',
      category: 'AI Services',
      rating: 4.9,
      reviewsCount: 204,
      price: 150,
      deliveryTime: '24 hours',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      pro: true
    }
  ]);

  const toggleFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateGig = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGigObj = {
      id: Date.now(),
      seller: newSeller || 'freelance_pro',
      sellerLevel: 'Pro Seller',
      sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      title: newTitle,
      category: newCategory,
      rating: 5.0,
      reviewsCount: 1,
      price: Number(newPrice) || 50,
      deliveryTime: newDelivery,
      image: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=800&auto=format&fit=crop&q=80',
      pro: true
    };

    setGigs([newGigObj, ...gigs]);
    setNewTitle('');
    setShowCreateModal(false);
  };

  const filteredGigs = gigs.filter(gig => {
    const matchesCategory = activeCategory === 'All' || gig.category === activeCategory;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gig.seller.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white font-sans flex flex-col">
      
      {/* Fiverr Navbar */}
      <header className="sticky top-0 z-50 bg-[#12161a] border-b border-[#222930] px-6 py-3 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="text-2xl font-black tracking-tight text-white">fiverr</span>
            <span className="w-2 h-2 rounded-full bg-[#1dbf73] mt-3"></span>
            <span className="ml-2 bg-[#1dbf73]/15 text-[#1dbf73] border border-[#1dbf73]/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">FREELANCE</span>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center relative w-80 lg:w-96">
            <input 
              type="text" 
              placeholder="What service are you looking for today?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c2229] border border-[#2e3742] rounded-lg pl-4 pr-10 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#1dbf73]"
            />
            <Search className="w-4 h-4 absolute right-3 text-gray-400" />
          </div>
        </div>

        {/* Navigation Action Links */}
        <div className="flex items-center gap-4 text-sm font-semibold">
          <button className="hidden lg:flex items-center gap-1.5 text-gray-300 hover:text-[#1dbf73] transition-colors">
            <Globe className="w-4 h-4" /> English
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-[#1dbf73] hover:bg-[#19a463] text-black font-extrabold px-4 py-2 rounded-lg transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> Post a Gig
          </button>

          <button className="border border-[#2e3742] hover:border-white px-4 py-2 rounded-lg text-white font-bold transition-all">
            Sign In
          </button>
        </div>
      </header>

      {/* Category Pills Bar */}
      <div className="bg-[#12161a] border-b border-[#222930] px-6 py-2 flex items-center gap-3 overflow-x-auto scrollbar-none text-xs font-bold text-gray-300">
        <span className="flex items-center gap-1 text-[#1dbf73] uppercase tracking-wider shrink-0 mr-2">
          <Filter className="w-3.5 h-3.5" /> Categories:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
              activeCategory === cat 
                ? 'bg-[#1dbf73] text-black font-black' 
                : 'bg-[#1c2229] hover:bg-[#28323c] text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hero Banner Header */}
      <section className="bg-gradient-to-r from-[#0b3c26] via-[#104a30] to-[#0d0f12] py-12 px-6 border-b border-[#222930] relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#1dbf73]/20 text-[#1dbf73] border border-[#1dbf73]/40 px-3 py-1 rounded-full text-xs font-extrabold uppercase">
              <Zap className="w-3.5 h-3.5" /> Fiverr Marketplace v2.0 Live
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Find the perfect <span className="text-[#1dbf73]">freelance services</span> for your business
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Access thousands of top-rated designers, developers, AI specialists, and digital marketers ready to complete your projects.
            </p>
          </div>
          
          <div className="hidden md:flex gap-4 bg-[#12161a]/80 p-5 rounded-2xl border border-[#222930] backdrop-blur shadow-2xl">
            <div className="text-center px-4">
              <div className="text-2xl font-black text-[#1dbf73]">4.9/5</div>
              <div className="text-xs text-gray-400">Average Rating</div>
            </div>
            <div className="border-r border-[#222930]"></div>
            <div className="text-center px-4">
              <div className="text-2xl font-black text-white">50M+</div>
              <div className="text-xs text-gray-400">Gigs Delivered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Freelance Marketplace Grid */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1dbf73]" /> Featured Freelance Gigs
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Showing {filteredGigs.length} available services in {activeCategory}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredGigs.map((gig) => (
            <div 
              key={gig.id} 
              className="bg-[#12161a] border border-[#222930] hover:border-[#1dbf73]/50 rounded-xl overflow-hidden flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg group"
            >
              <div>
                {/* Gig Preview Image */}
                <div className="relative h-44 overflow-hidden bg-[#1c2229]">
                  <img 
                    src={gig.image} 
                    alt={gig.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <button 
                    onClick={() => toggleFavorite(gig.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur transition-all ${
                      favorites[gig.id] ? 'text-red-500' : 'text-white hover:text-red-400'
                    }`}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                  {gig.pro && (
                    <span className="absolute top-3 left-3 bg-[#1dbf73] text-black font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      Fiverr Pro
                    </span>
                  )}
                </div>

                {/* Seller Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <img src={gig.sellerAvatar} alt={gig.seller} className="w-8 h-8 rounded-full border border-[#2e3742]" />
                    <div>
                      <div className="font-bold text-xs text-white leading-tight flex items-center gap-1">
                        <span>{gig.seller}</span>
                        <CheckCircle className="w-3 h-3 text-[#1dbf73]" />
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">{gig.sellerLevel}</div>
                    </div>
                  </div>

                  {/* Gig Title */}
                  <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 hover:text-[#1dbf73] transition-colors cursor-pointer leading-snug">
                    {gig.title}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{gig.rating}</span>
                    <span className="text-gray-500 font-normal">({gig.reviewsCount})</span>
                  </div>
                </div>
              </div>

              {/* Price Footer */}
              <div className="px-4 py-3 border-t border-[#222930] bg-[#161b20] flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">STARTING AT</span>
                <div className="text-base font-black text-white">
                  ${gig.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal for Creating New Gig */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161a] border border-[#2e3742] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222930] pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#1dbf73]" /> Create a New Freelance Gig
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateGig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Gig Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="I will do something I am really good at..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1c2229] text-white px-3.5 py-2.5 rounded-lg border border-[#2e3742] text-sm focus:outline-none focus:border-[#1dbf73]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#1c2229] text-white px-3 py-2.5 rounded-lg border border-[#2e3742] text-sm focus:outline-none focus:border-[#1dbf73]"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Starting Price ($)</label>
                  <input 
                    type="number" 
                    required
                    min={5}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-[#1c2229] text-white px-3.5 py-2.5 rounded-lg border border-[#2e3742] text-sm focus:outline-none focus:border-[#1dbf73]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seller Username</label>
                  <input 
                    type="text" 
                    value={newSeller}
                    onChange={(e) => setNewSeller(e.target.value)}
                    className="w-full bg-[#1c2229] text-white px-3.5 py-2.5 rounded-lg border border-[#2e3742] text-sm focus:outline-none focus:border-[#1dbf73]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Delivery Time</label>
                  <input 
                    type="text" 
                    value={newDelivery}
                    onChange={(e) => setNewDelivery(e.target.value)}
                    className="w-full bg-[#1c2229] text-white px-3.5 py-2.5 rounded-lg border border-[#2e3742] text-sm focus:outline-none focus:border-[#1dbf73]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222930]">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-gray-300 hover:bg-[#1c2229]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-[#1dbf73] hover:bg-[#19a463] text-black font-extrabold shadow-lg"
                >
                  Publish Gig
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#12161a] border-t border-[#222930] py-6 px-6 text-center text-xs text-gray-400">
        <p>© 2026 Fiverr Freelance Clone. Built with React & Tailwind live on Vercel.</p>
      </footer>

    </div>
  );
}
