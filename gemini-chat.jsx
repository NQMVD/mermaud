import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Github, 
  Star, 
  Info, 
  Code, 
  Layout, 
  Cpu, 
  Globe, 
  Settings,
  Menu,
  X,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  User,
  Bell,
  Lock,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  FileText,
  Layers,
  History
} from 'lucide-react';

// Erweiterte Mock Data mit Installations-Status
const APPS_DATA = [
  {
    id: 1,
    name: "OctoEdit",
    developer: "GitHub Community",
    stars: "12.4k",
    description: "Ein leichtgewichtiger Markdown-Editor mit nativer GitHub-Synchronisation.",
    category: "Developer Tools",
    version: "2.4.1",
    tags: ["Markdown", "Open Source"],
    isFeatured: true,
    isInstalled: true,
    size: "42 MB"
  },
  {
    id: 2,
    name: "GitPulse",
    developer: "MetricsLabs",
    stars: "8.9k",
    description: "Echtzeit-Dashboard für Repository-Metriken und Team-Produktivität.",
    category: "Productivity",
    version: "1.0.5",
    tags: ["Analytics", "Dashboards"],
    isFeatured: false,
    isInstalled: false,
    size: "156 MB"
  },
  {
    id: 3,
    name: "PromptFlow",
    developer: "AI Research Group",
    stars: "15.2k",
    description: "Manage deine LLM-Prompts direkt in deinem Git-Workflow.",
    category: "AI",
    version: "0.9.8",
    tags: ["AI", "Prompt Engineering"],
    isFeatured: true,
    isInstalled: true,
    size: "89 MB"
  },
  {
    id: 4,
    name: "CommitGraph",
    developer: "VisualGit",
    stars: "5.1k",
    description: "Visualisiere komplexe Branch-Strukturen mit interaktiven Graphen.",
    category: "Developer Tools",
    version: "3.2.0",
    tags: ["Visualizer", "Git"],
    isFeatured: false,
    isInstalled: false,
    size: "24 MB"
  },
  {
    id: 5,
    name: "DeployBeacon",
    developer: "CloudOps",
    stars: "7.3k",
    description: "Automatisierte Deployment-Benachrichtigungen für GitHub Actions.",
    category: "Utilities",
    version: "2.1.1",
    tags: ["CI/CD", "DevOps"],
    isFeatured: false,
    isInstalled: true,
    size: "12 MB"
  },
  {
    id: 6,
    name: "SecureAudit",
    developer: "GuardRail",
    stars: "10.8k",
    description: "Scannt Repositories nach Sicherheitslücken und Secrets in Echtzeit.",
    category: "Security",
    version: "1.5.0",
    tags: ["Security", "Audit"],
    isFeatured: false,
    isInstalled: false,
    size: "210 MB"
  }
];

const CATEGORIES = ["Alle", "AI", "Developer Tools", "Productivity", "Utilities", "Security"];

const App = () => {
  const [activeTab, setActiveTab] = useState("Alle"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Filter Logik für den Store
  const filteredApps = APPS_DATA.filter(app => {
    const matchesCategory = activeTab === "Alle" || app.category === activeTab;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const installedApps = APPS_DATA.filter(app => app.isInstalled);
  const featuredApps = APPS_DATA.filter(app => app.isFeatured);

  const isTabActive = (tabName) => activeTab === tabName && !selectedApp;

  // Render Funktion für die Detailansicht (Unterseite)
  const renderDetailView = () => (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 h-full flex flex-col bg-[#111111]">
       {/* Detail Toolbar / Back Button */}
       <div className="h-16 border-b border-[#2a2a2a] flex items-center px-8 bg-[#111111]/95 backdrop-blur-md z-20 gap-4 sticky top-0">
          <button 
            onClick={() => setSelectedApp(null)}
            className="p-2 -ml-2 hover:bg-[#222] rounded-full text-[#666] hover:text-white transition-colors group flex items-center gap-2 pr-4"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Zurück</span>
          </button>
          <div className="h-4 w-[1px] bg-[#2a2a2a]" />
          <span className="text-sm text-[#444]">{selectedApp.category}</span>
          <span className="text-sm text-[#444]">•</span>
          <span className="text-sm text-[#888]">{selectedApp.name}</span>
       </div>

       {/* Detail Content */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-6xl mx-auto">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row gap-8 mb-12">
                {/* Icon */}
                <div className="w-40 h-40 bg-[#1a1a1a] rounded-3xl flex items-center justify-center border border-[#333] shadow-2xl shrink-0 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-[#ffffff05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Github size={80} className="text-[#d97757]" />
                </div>
                
                {/* Meta Header */}
                <div className="flex-1 pt-2">
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-6">
                      <div>
                         <h1 className="text-5xl font-light text-white mb-3 tracking-tight">{selectedApp.name}</h1>
                         <div className="flex items-center gap-4 text-sm text-[#888]">
                            <span className="text-[#d97757] font-medium">{selectedApp.developer}</span>
                            <span className="w-1 h-1 rounded-full bg-[#444]" />
                            <span>v{selectedApp.version}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {selectedApp.isInstalled ? (
                            <>
                                <button className="bg-[#222] text-[#ccc] px-6 py-3 rounded-lg font-medium border border-[#333] flex items-center gap-2 cursor-default min-w-[140px] justify-center">
                                   <CheckCircle2 size={18} className="text-green-500" /> Installiert
                                </button>
                                <button className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] rounded-lg hover:bg-[#222] hover:text-white transition-colors">
                                    <Settings size={20} />
                                </button>
                            </>
                         ) : (
                            <button className="bg-[#d97757] hover:bg-[#e08a6d] text-black px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(217,119,87,0.2)] hover:shadow-[0_0_35px_rgba(217,119,87,0.3)] hover:-translate-y-0.5 min-w-[160px] justify-center">
                               <Download size={20} /> Installieren
                            </button>
                         )}
                      </div>
                   </div>
                   
                   {/* Stats Bar */}
                   <div className="flex items-center gap-8 border-t border-[#2a2a2a] pt-6">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1.5 text-white font-medium text-lg">
                            {selectedApp.stars} <Star size={14} className="fill-[#d97757] text-[#d97757]" />
                         </div>
                         <span className="text-[#555] text-xs uppercase tracking-wider font-semibold">Rating</span>
                      </div>
                      <div className="w-[1px] h-8 bg-[#2a2a2a]" />
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1.5 text-white font-medium text-lg">
                            200k+
                         </div>
                         <span className="text-[#555] text-xs uppercase tracking-wider font-semibold">Downloads</span>
                      </div>
                       <div className="w-[1px] h-8 bg-[#2a2a2a]" />
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1.5 text-white font-medium text-lg">
                            {selectedApp.size}
                         </div>
                         <span className="text-[#555] text-xs uppercase tracking-wider font-semibold">Größe</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Main Layout Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-12">
                   
                   {/* Screenshots */}
                   <section>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Vorschau</h3>
                        <div className="flex gap-2">
                            <button className="p-1.5 rounded-full bg-[#222] text-[#666] hover:text-white"><ArrowLeft size={14} /></button>
                            <button className="p-1.5 rounded-full bg-[#222] text-[#666] hover:text-white"><ChevronRight size={14} /></button>
                        </div>
                      </div>
                      <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar -mx-2 px-2">
                         {[1, 2, 3].map(i => (
                            <div key={i} className="flex-shrink-0 w-[400px] aspect-video bg-[#161616] border border-[#2a2a2a] rounded-xl flex items-center justify-center relative group overflow-hidden cursor-pointer hover:border-[#444] transition-colors">
                               <div className="absolute inset-0 bg-gradient-to-br from-[#222] to-[#0f0f0f]" />
                               
                               {/* Fake UI elements for screenshot */}
                               <div className="absolute top-4 left-4 right-4 h-4 bg-[#2a2a2a] rounded-full opacity-50" />
                               <div className="absolute top-12 left-4 w-1/4 bottom-4 bg-[#2a2a2a] rounded-lg opacity-30" />
                               <div className="absolute top-12 right-4 left-[30%] h-20 bg-[#2a2a2a] rounded-lg opacity-40" />
                               <div className="absolute top-36 right-4 left-[30%] bottom-4 bg-[#2a2a2a] rounded-lg opacity-20" />

                               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                    <Eye className="text-white drop-shadow-lg" size={32} />
                               </div>
                            </div>
                         ))}
                      </div>
                   </section>

                   {/* Description / Readme */}
                   <section>
                      <div className="flex items-center gap-3 mb-6 border-b border-[#2a2a2a] pb-4">
                         <button className="text-sm font-medium text-[#d97757] border-b-2 border-[#d97757] pb-4 -mb-4.5 px-2">Beschreibung</button>
                         <button className="text-sm font-medium text-[#666] hover:text-white pb-4 -mb-4 px-2 transition-colors">Changelog</button>
                         <button className="text-sm font-medium text-[#666] hover:text-white pb-4 -mb-4 px-2 transition-colors">Reviews</button>
                      </div>
                      
                      <div className="text-[#aaa] leading-relaxed space-y-6 text-base font-light">
                         <p className="text-xl text-[#eee] font-normal">"{selectedApp.description}"</p>
                         <p>
                            Dies ist eine leistungsstarke Anwendung, die speziell für den modernen GitHub-Workflow entwickelt wurde. Sie verbindet Geschwindigkeit mit Sicherheit und bietet eine nahtlose Integration in Ihre bestehenden Repositories.
                         </p>
                         <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                         </p>
                         
                         <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#2a2a2a]">
                                <Zap className="text-[#d97757] mb-3" size={24} />
                                <h4 className="text-white font-medium mb-1">Blitzschnell</h4>
                                <p className="text-sm text-[#666]">Optimierte Performance für große Repositories.</p>
                            </div>
                            <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#2a2a2a]">
                                <ShieldCheck className="text-[#d97757] mb-3" size={24} />
                                <h4 className="text-white font-medium mb-1">Sicher</h4>
                                <p className="text-sm text-[#666]">Enterprise-Grade Verschlüsselung für alle Daten.</p>
                            </div>
                         </div>
                      </div>
                   </section>
                </div>

                {/* Right Column (Sidebar Info) */}
                <div className="lg:col-span-1 space-y-10">
                   <section>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">Infos</h3>
                      <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden divide-y divide-[#2a2a2a]">
                         <div className="p-4 flex items-center justify-between">
                            <span className="text-sm text-[#666]">Version</span>
                            <span className="text-sm text-[#ccc] font-mono">v{selectedApp.version}</span>
                         </div>
                         <div className="p-4 flex items-center justify-between">
                            <span className="text-sm text-[#666]">Lizenz</span>
                            <span className="text-sm text-[#ccc]">MIT</span>
                         </div>
                         <div className="p-4 flex items-center justify-between">
                            <span className="text-sm text-[#666]">Letztes Update</span>
                            <span className="text-sm text-[#ccc]">Vor 2 Tagen</span>
                         </div>
                         <div className="p-4 flex items-center justify-between">
                            <span className="text-sm text-[#666]">Plattform</span>
                            <span className="text-sm text-[#ccc]">Win, Mac, Linux</span>
                         </div>
                      </div>
                   </section>

                   <section>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">Links</h3>
                      <div className="space-y-3">
                         <button className="w-full text-left px-4 py-3 bg-[#161616] border border-[#2a2a2a] rounded-lg hover:bg-[#222] hover:border-[#444] transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <Github size={16} className="text-[#666] group-hover:text-white" />
                                <span className="text-sm text-[#ccc] group-hover:text-white">Repository</span>
                            </div>
                            <ExternalLink size={14} className="text-[#444] group-hover:text-[#d97757]" />
                         </button>
                         <button className="w-full text-left px-4 py-3 bg-[#161616] border border-[#2a2a2a] rounded-lg hover:bg-[#222] hover:border-[#444] transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <Globe size={16} className="text-[#666] group-hover:text-white" />
                                <span className="text-sm text-[#ccc] group-hover:text-white">Website</span>
                            </div>
                            <ExternalLink size={14} className="text-[#444] group-hover:text-[#d97757]" />
                         </button>
                         <button className="w-full text-left px-4 py-3 bg-[#161616] border border-[#2a2a2a] rounded-lg hover:bg-[#222] hover:border-[#444] transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-[#666] group-hover:text-white" />
                                <span className="text-sm text-[#ccc] group-hover:text-white">Dokumentation</span>
                            </div>
                            <ExternalLink size={14} className="text-[#444] group-hover:text-[#d97757]" />
                         </button>
                      </div>
                   </section>

                   <section>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                         {selectedApp.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-[#1a1a1a] text-[#888] text-xs rounded-full border border-[#2a2a2a] hover:border-[#d97757] hover:text-[#d97757] transition-colors cursor-pointer">
                               #{tag}
                            </span>
                         ))}
                      </div>
                   </section>
                </div>
             </div>
          </div>
       </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#111111] text-[#f0f0f0] font-sans overflow-hidden selection:bg-[#d9775733] selection:text-[#d97757]">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-[#2a2a2a] bg-[#0d0d0d] flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#d97757] rounded flex items-center justify-center">
            <Github size={20} className="text-black" />
          </div>
          <span className="font-medium text-lg tracking-tight">GitStore</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2 px-2 mt-4">Entdecken</div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveTab(cat); setSelectedApp(null); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-3 ${
                isTabActive(cat) ? 'bg-[#222] text-[#d97757]' : 'text-[#999] hover:bg-[#1a1a1a] hover:text-[#ccc]'
              }`}
            >
              {cat === "Alle" && <Layout size={16} />}
              {cat === "AI" && <Cpu size={16} />}
              {cat === "Developer Tools" && <Code size={16} />}
              {cat === "Productivity" && <Zap size={16} />}
              {cat === "Utilities" && <Info size={16} />}
              {cat === "Security" && <ShieldCheck size={16} />}
              {cat}
            </button>
          ))}
          
          <div className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2 px-2 mt-8">Verwalten</div>
          <button 
            onClick={() => { setActiveTab("Installed"); setSelectedApp(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-3 ${
              isTabActive("Installed") ? 'bg-[#222] text-[#d97757]' : 'text-[#999] hover:bg-[#1a1a1a] hover:text-[#ccc]'
            }`}
          >
            <Download size={16} /> Installiert
          </button>
          <button 
            onClick={() => { setActiveTab("Settings"); setSelectedApp(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-3 ${
              isTabActive("Settings") ? 'bg-[#222] text-[#d97757]' : 'text-[#999] hover:bg-[#1a1a1a] hover:text-[#ccc]'
            }`}
          >
            <Settings size={16} /> Einstellungen
          </button>
        </nav>

        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#333] to-[#555] group-hover:ring-1 ring-[#d97757]" />
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">DevUser_2024</div>
              <div className="text-xs text-[#666] truncate">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#111111]">
        
        {/* Render Logic: Entweder Detail View ODER Listen/Settings Views */}
        {selectedApp ? (
            renderDetailView()
        ) : (
            <>
                {/* Header - Nur anzeigen wenn nicht in Detailansicht */}
                {activeTab !== "Settings" && (
                <header className="h-16 border-b border-[#2a2a2a] flex items-center justify-between px-8 bg-[#111111]/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                        <input 
                        type="text" 
                        placeholder={activeTab === "Installed" ? "In installierten Apps suchen..." : "Apps, Entwickler oder Tools suchen..."}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#444]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                    <div className="h-4 w-[1px] bg-[#2a2a2a]" />
                    <button className="text-xs text-[#666] hover:text-[#d97757] font-mono transition-colors flex items-center gap-2">
                        <Globe size={14} /> Global
                    </button>
                    </div>
                </header>
                )}

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* VIEW: STORE (ALLE/CATEGORIES) */}
                    {CATEGORIES.includes(activeTab) && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === "Alle" && !searchQuery && (
                            <section className="mb-12">
                            <h2 className="text-2xl font-light tracking-tight text-white mb-6">Empfehlungen der Woche</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {featuredApps.map(app => (
                                <div key={app.id} onClick={() => setSelectedApp(app)} className="group bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 cursor-pointer hover:border-[#d9775766] transition-all duration-300 relative overflow-hidden hover:shadow-2xl hover:-translate-y-1">
                                    <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] uppercase tracking-widest text-[#d97757] font-bold bg-[#d977571a] px-2 py-0.5 rounded">Featured</span>
                                        <div className="flex items-center gap-1 text-xs text-[#666]"><Star size={12} className="fill-[#666]" /> {app.stars}</div>
                                    </div>
                                    <h3 className="text-xl font-medium mb-2 group-hover:text-[#d97757] transition-colors">{app.name}</h3>
                                    <p className="text-[#999] text-sm leading-relaxed mb-6 max-w-md">{app.description}</p>
                                    <button className="bg-[#f0f0f0] text-[#111] px-4 py-1.5 rounded text-sm font-medium hover:bg-white transition-colors flex items-center gap-2 shadow-lg">
                                        <Download size={14} /> Installieren
                                    </button>
                                    </div>
                                    <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Github size={160} />
                                    </div>
                                </div>
                                ))}
                            </div>
                            </section>
                        )}

                        <section>
                            <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-light tracking-tight text-white">
                                {activeTab === "Alle" ? "Alle Entdeckungen" : activeTab}
                            </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredApps.map(app => (
                                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-[#161616] border border-[#2a2a2a] p-5 rounded-xl hover:bg-[#1c1c1c] hover:border-[#d9775780] transition-all duration-300 cursor-pointer group relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1">
                                    {/* Hover Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#d977570d] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="w-12 h-12 bg-[#222] rounded-xl flex items-center justify-center group-hover:bg-[#2a2a2a] transition-colors shadow-inner border border-[#333]">
                                        <Github size={24} className="text-[#999] group-hover:text-[#d97757] transition-colors" />
                                        </div>
                                        {app.isInstalled && (
                                            <div className="bg-[#222] p-1.5 rounded-full border border-[#333] shadow-sm" title="Installiert">
                                                <CheckCircle2 size={12} className="text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold mb-1 text-[#eee] group-hover:text-[#d97757] transition-colors">{app.name}</h3>
                                        <p className="text-[#888] text-xs leading-relaxed line-clamp-2 mb-4 min-h-[2.5em]">{app.description}</p>
                                        
                                        <div className="flex items-center gap-2 mb-4">
                                            {app.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[10px] bg-[#222] text-[#666] px-2 py-0.5 rounded border border-[#333]">{tag}</span>
                                            ))}
                                        </div>

                                        <div className="pt-3 border-t border-[#2a2a2a] flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[11px] text-[#666]">
                                                    <Star size={11} className="text-[#555] group-hover:text-[#d97757] transition-colors" /> {app.stars}
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-[#666]">
                                                    <Download size={11} className="text-[#555]" /> {app.size}
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center group-hover:bg-[#d97757] transition-colors shadow-sm">
                                                <ChevronRight size={14} className="text-[#666] group-hover:text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </section>
                        </div>
                    )}

                    {/* VIEW: INSTALLED */}
                    {activeTab === "Installed" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-8">
                            <h2 className="text-3xl font-light tracking-tight text-white mb-2">Deine Bibliothek</h2>
                            <p className="text-[#666] text-sm">Verwalte deine lokal installierten GitHub-Anwendungen.</p>
                        </div>

                        <div className="space-y-4">
                            {installedApps.length > 0 ? (
                            installedApps.map(app => (
                                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 flex items-center justify-between hover:bg-[#181818] transition-colors group cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center border border-[#333]">
                                    <Github size={24} className="text-[#d97757]" />
                                    </div>
                                    <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-medium text-white">{app.name}</h3>
                                        <span className="text-[10px] px-2 py-0.5 bg-[#2a2a2a] text-[#888] rounded-full uppercase tracking-tighter">Bereit</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-[#666]">
                                        <span className="flex items-center gap-1"><RefreshCw size={10} /> v{app.version}</span>
                                        <span>Größe: {app.size}</span>
                                        <span className="text-[#444]">Zuletzt genutzt: Gestern</span>
                                    </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="px-4 py-2 bg-[#222] hover:bg-[#333] text-[#ccc] rounded-lg text-sm transition-colors border border-[#333]">Öffnen</button>
                                    <button className="p-2 hover:bg-[#333] text-[#666] hover:text-red-400 rounded-lg transition-colors" title="Deinstallieren" onClick={(e) => e.stopPropagation()}>
                                    <Trash2 size={18} />
                                    </button>
                                </div>
                                </div>
                            ))
                            ) : (
                            <div className="py-20 text-center border-2 border-dashed border-[#222] rounded-3xl">
                                <Download size={40} className="mx-auto text-[#222] mb-4" />
                                <p className="text-[#666]">Du hast noch keine Apps installiert.</p>
                            </div>
                            )}
                        </div>
                        </div>
                    )}

                    {/* VIEW: SETTINGS */}
                    {activeTab === "Settings" && (
                        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                        <div className="mb-12">
                            <h2 className="text-3xl font-light tracking-tight text-white mb-2">Einstellungen</h2>
                            <p className="text-[#666] text-sm">Konfiguriere GitStore nach deinen Bedürfnissen.</p>
                        </div>

                        <div className="grid grid-cols-4 gap-8">
                            {/* Settings Sidebar Nav */}
                            <div className="col-span-1 space-y-1">
                            {[
                                { id: 'profile', label: 'Profil', icon: <User size={16} /> },
                                { id: 'appearance', label: 'Erscheinungsbild', icon: <Eye size={16} /> },
                                { id: 'notifications', label: 'Benachrichtigungen', icon: <Bell size={16} /> },
                                { id: 'security', label: 'Sicherheit', icon: <Lock size={16} /> },
                                { id: 'storage', label: 'Speicherplatz', icon: <Layout size={16} /> },
                            ].map(item => (
                                <button key={item.id} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${item.id === 'profile' ? 'bg-[#222] text-[#d97757]' : 'text-[#666] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>
                                {item.icon}
                                {item.label}
                                </button>
                            ))}
                            </div>

                            {/* Settings Main Body */}
                            <div className="col-span-3 space-y-10">
                            <section>
                                <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-6 border-b border-[#222] pb-2">Benutzerprofil</h3>
                                <div className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#333] to-[#555] relative flex items-center justify-center text-2xl font-light border border-[#444]">
                                    DU
                                    <button className="absolute bottom-0 right-0 p-1.5 bg-[#d97757] rounded-full text-black hover:scale-110 transition-transform">
                                        <RefreshCw size={12} />
                                    </button>
                                    </div>
                                    <div className="flex-1">
                                    <label className="block text-xs text-[#555] uppercase font-bold mb-1">Anzeigename</label>
                                    <input type="text" className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d97757]" defaultValue="DevUser_2024" />
                                    <p className="text-[10px] text-[#444] mt-2">Dies ist dein Name innerhalb der GitStore Community.</p>
                                    </div>
                                </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-6 border-b border-[#222] pb-2">Präferenzen</h3>
                                <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-[#161616] border border-[#2a2a2a] rounded-xl">
                                    <div>
                                    <div className="text-sm font-medium text-[#ccc]">Auto-Updates</div>
                                    <div className="text-xs text-[#555]">Apps im Hintergrund automatisch aktualisieren.</div>
                                    </div>
                                    <div className="w-10 h-5 bg-[#d97757] rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-[#161616] border border-[#2a2a2a] rounded-xl">
                                    <div>
                                    <div className="text-sm font-medium text-[#ccc]">Hardware-Beschleunigung</div>
                                    <div className="text-xs text-[#555]">GPU für flüssigere UI-Animationen nutzen.</div>
                                    </div>
                                    <div className="w-10 h-5 bg-[#333] rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-[#666] rounded-full" />
                                    </div>
                                </div>
                                </div>
                            </section>

                            <div className="pt-4 flex justify-end gap-3">
                                <button className="px-6 py-2 text-sm text-[#666] hover:text-white transition-colors">Abbrechen</button>
                                <button className="px-6 py-2 text-sm bg-[#d97757] text-black font-semibold rounded-lg hover:bg-[#e08a6d] transition-colors shadow-lg shadow-[#d977571a]">Speichern</button>
                            </div>
                            </div>
                        </div>
                        </div>
                    )}
                </div>
            </>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a3a3a;
        }
      `}</style>
    </div>
  );
};

export default App;