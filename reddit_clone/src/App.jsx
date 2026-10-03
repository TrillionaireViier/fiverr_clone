import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Plus, 
  Search, 
  Bell, 
  User, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Award, 
  ExternalLink,
  Shield,
  Zap,
  Check,
  Compass,
  LayoutGrid
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Hot');
  const [activeCommunity, setActiveCommunity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPosts, setSavedPosts] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubreddit, setNewSubreddit] = useState('r/webdev');

  const communities = [
    { id: 'all', name: 'r/all', members: '34.2M', icon: '🌐', desc: 'The front page of the internet' },
    { id: 'webdev', name: 'r/webdev', members: '1.8M', icon: '💻', desc: 'Web development news, tutorials & showcase' },
    { id: 'technology', name: 'r/technology', members: '14.5M', icon: '🚀', desc: 'Tech news and breakthroughs' },
    { id: 'crypto', name: 'r/cryptocurrency', members: '7.2M', icon: '🪙', desc: 'Blockchain and crypto discussions' },
    { id: 'ai', name: 'r/artificial', members: '3.1M', icon: '🧠', desc: 'Artificial Intelligence & Machine Learning' }
  ];

  const [posts, setPosts] = useState([
    {
      id: 1,
      subreddit: 'r/webdev',
      author: 'u/frontend_wizard',
      time: '3 hours ago',
      title: '🚀 We just launched Reddit Clone v2 with instant live state, modern UI & Vercel edge deployment!',
      content: 'Built using React, Lucide Icons, and ultra-fast component architecture. Check out the clean dark mode aesthetic, voting system, and subreddit filtering system.',
      votes: 1420,
      comments: 184,
      userVote: 0,
      badge: 'PROMOTED / HOT',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      subreddit: 'r/artificial',
      author: 'u/deep_mind_dev',
      time: '5 hours ago',
      title: '🤖 Next Generation Autonomous Agents: How real-time reasoning is transforming modern software engineering',
      content: 'Autonomous agents can now synthesize complex codebases, auto-repair deployments, and orchestrate cloud resources without human friction.',
      votes: 890,
      comments: 92,
      userVote: 0,
      badge: 'AI NEWS'
    },
    {
      id: 3,
      subreddit: 'r/technology',
      author: 'u/silicon_insider',
      time: '7 hours ago',
      title: '⚡ Quantum HFT Protocol achieves sub-millisecond execution speeds across distributed nodes',
      content: 'Engineers released benchmark data showing unprecedented throughput under high latency market conditions.',
      votes: 2150,
      comments: 310,
      userVote: 0,
      badge: 'TRENDING'
    }
  ]);

  const handleVote = (id, direction) => {
    setPosts(posts.map(post => {
      if (post.id !== id) return post;
      let voteDiff = 0;
      let newVote = 0;

      if (post.userVote === direction) {
        voteDiff = -direction;
        newVote = 0;
      } else {
        voteDiff = direction - post.userVote;
        newVote = direction;
      }

      return {
        ...post,
        votes: post.votes + voteDiff,
        userVote: newVote
      };
    }));
  };

  const toggleSave = (id) => {
    setSavedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPostObj = {
      id: Date.now(),
      subreddit: newSubreddit,
      author: 'u/current_user',
      time: 'Just now',
      title: newTitle,
      content: newContent,
      votes: 1,
      comments: 0,
      userVote: 1,
      badge: 'NEW POST'
    };

    setPosts([newPostObj, ...posts]);
    setNewTitle('');
    setNewContent('');
    setShowCreateModal(false);
  };

  const filteredPosts = posts.filter(post => {
    const matchesCommunity = activeCommunity === 'all' || post.subreddit.toLowerCase() === `r/${activeCommunity}`;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCommunity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b1416] text-[#e2e8f0] flex flex-col font-sans">
      
      {/* Top Reddit Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0f1a1c] border-b border-[#1a282d] px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveCommunity('all')}>
            <div className="w-9 h-9 rounded-full bg-[#ff4500] flex items-center justify-center font-black text-white text-xl shadow-lg">
              r/
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white hidden sm:inline">reddit</span>
            <span className="bg-[#ff4500] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">PRO</span>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-4 bg-[#1a282d] hover:bg-[#22333b] px-3 py-1.5 rounded-full border border-[#273739] text-xs font-semibold cursor-pointer">
            <Compass className="w-4 h-4 text-[#ff4500]" />
            <span>{activeCommunity === 'all' ? 'r/all' : `r/${activeCommunity}`}</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Reddit Clone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a282d] text-white pl-9 pr-4 py-2 rounded-full border border-[#273739] focus:outline-none focus:border-[#ff4500] text-sm placeholder-gray-400"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-[#ff4500] hover:bg-[#e03d00] text-white font-bold px-4 py-1.5 rounded-full text-sm transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>

          <button className="p-2 hover:bg-[#1a282d] rounded-full text-gray-300 relative">
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 bg-[#ff4500] rounded-full absolute top-1.5 right-1.5"></span>
          </button>

          <div className="flex items-center gap-2 p-1 hover:bg-[#1a282d] rounded-full border border-[#273739] cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-xs text-white">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Main Reddit Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex gap-6">
        
        {/* Left Sidebar Communities */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="bg-[#0f1a1c] border border-[#1a282d] rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-[#ff4500]" /> Feeds & Subreddits
            </h3>
            <div className="space-y-1">
              {communities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCommunity(c.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeCommunity === c.id 
                      ? 'bg-[#1a282d] text-[#ff4500] border border-[#ff4500]/30' 
                      : 'text-gray-300 hover:bg-[#152226]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{c.icon}</span>
                    <span>{c.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{c.members}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0f1a1c] border border-[#1a282d] rounded-xl p-4 text-xs text-gray-400 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" /> Reddit Clone v2.0
            </div>
            <p>Built with React, Vite, Tailwind UI and deployed live to Vercel production edge servers.</p>
            <div className="pt-2 border-t border-[#1a282d] text-[11px] text-gray-500">
              © 2026 TrillionaireViier. All rights reserved.
            </div>
          </div>
        </aside>

        {/* Center Feed */}
        <main className="flex-1 min-w-0 space-y-4">
          
          {/* Feed Filter Header */}
          <div className="bg-[#0f1a1c] border border-[#1a282d] rounded-xl p-3 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              {[
                { name: 'Hot', icon: Flame },
                { name: 'New', icon: Sparkles },
                { name: 'Top', icon: TrendingUp },
                { name: 'Rising', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeTab === tab.name 
                        ? 'bg-[#ff4500] text-white shadow-md' 
                        : 'bg-[#1a282d] text-gray-300 hover:bg-[#22333b]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-semibold text-gray-400 flex items-center gap-1 pr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Showing: {filteredPosts.length} posts</span>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-[#0f1a1c] border border-[#1a282d] hover:border-[#273739] rounded-xl p-4 flex gap-4 transition-all shadow-sm">
                
                {/* Voting Column */}
                <div className="flex flex-col items-center bg-[#152226] p-1.5 rounded-lg h-fit border border-[#1a282d]">
                  <button 
                    onClick={() => handleVote(post.id, 1)}
                    className={`p-1 rounded hover:bg-[#1a282d] transition-all ${post.userVote === 1 ? 'text-[#ff4500]' : 'text-gray-400'}`}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <span className={`text-xs font-extrabold my-1 ${post.userVote === 1 ? 'text-[#ff4500]' : post.userVote === -1 ? 'text-blue-400' : 'text-gray-200'}`}>
                    {post.votes}
                  </span>
                  <button 
                    onClick={() => handleVote(post.id, -1)}
                    className={`p-1 rounded hover:bg-[#1a282d] transition-all ${post.userVote === -1 ? 'text-blue-400' : 'text-gray-400'}`}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400">
                    <span className="font-bold text-white hover:underline cursor-pointer">{post.subreddit}</span>
                    <span>•</span>
                    <span>Posted by {post.author}</span>
                    <span>{post.time}</span>
                    {post.badge && (
                      <span className="bg-[#ff4500]/15 text-[#ff4500] font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-[#ff4500]/30 ml-auto">
                        {post.badge}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-white hover:text-[#ff4500] cursor-pointer transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-sm text-gray-300 leading-relaxed">
                    {post.content}
                  </p>

                  {post.image && (
                    <div className="pt-2">
                      <img src={post.image} alt="Post Attachment" className="rounded-lg max-h-96 w-full object-cover border border-[#1a282d]" />
                    </div>
                  )}

                  {/* Post Footer Actions */}
                  <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-gray-400">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#1a282d] hover:text-white transition-all">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments} Comments</span>
                    </button>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#1a282d] hover:text-white transition-all">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>

                    <button 
                      onClick={() => toggleSave(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#1a282d] transition-all ${savedPosts[post.id] ? 'text-[#ff4500]' : 'hover:text-white'}`}
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>{savedPosts[post.id] ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* Right Sidebar Widgets */}
        <aside className="hidden xl:block w-72 shrink-0 space-y-6">
          <div className="bg-[#0f1a1c] border border-[#1a282d] rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Trending Communities
            </h3>
            <div className="space-y-3">
              {communities.slice(1).map((comm, idx) => (
                <div key={comm.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-500">{idx + 1}</span>
                    <span className="text-base">{comm.icon}</span>
                    <div>
                      <div className="font-bold text-white hover:underline cursor-pointer" onClick={() => setActiveCommunity(comm.id)}>{comm.name}</div>
                      <div className="text-[10px] text-gray-500">{comm.members} members</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveCommunity(comm.id)}
                    className="bg-[#1a282d] hover:bg-[#ff4500] hover:text-white text-gray-300 px-3 py-1 rounded-full font-bold text-[11px] transition-all"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* Modal for Creating New Post */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1a1c] border border-[#273739] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1a282d] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#ff4500]" /> Create a Post
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Choose Subreddit</label>
                <select 
                  value={newSubreddit} 
                  onChange={(e) => setNewSubreddit(e.target.value)}
                  className="w-full bg-[#1a282d] text-white px-3 py-2 rounded-lg border border-[#273739] text-sm focus:outline-none focus:border-[#ff4500]"
                >
                  {communities.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.name}>{c.name} - {c.desc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="Title of your post..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1a282d] text-white px-3 py-2 rounded-lg border border-[#273739] text-sm focus:outline-none focus:border-[#ff4500]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Content (Optional)</label>
                <textarea 
                  rows={4}
                  placeholder="Text, links, or description..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#1a282d] text-white px-3 py-2 rounded-lg border border-[#273739] text-sm focus:outline-none focus:border-[#ff4500]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-sm font-bold text-gray-300 hover:bg-[#1a282d]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-full text-sm font-bold bg-[#ff4500] hover:bg-[#e03d00] text-white shadow-md"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
