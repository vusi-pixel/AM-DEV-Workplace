import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FolderKanban, FileText, MessageSquare, Plus, Download, 
  ExternalLink, Laptop, UserCheck, Briefcase, Building, 
  Search, Users, Send, CheckCircle2, Pin, Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  updatedAt: string;
  author: string;
}

interface ChannelMessage {
  id: string;
  author: string;
  avatar: string;
  role: string;
  time: string;
  content: string;
  likes: number;
}

export const Workspaces: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'engineering';

  const [searchQuery, setSearchQuery] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [messages, setMessages] = useState<Record<string, ChannelMessage[]>>({
    engineering: [
      {
        id: '1',
        author: 'Marcus Vance',
        avatar: 'M',
        role: 'Principal Architect',
        time: '10:45 AM',
        content: 'The v2.4 microservices RFC has been approved. Migration of the session store to PostgreSQL connect-pg-simple is complete and verified.',
        likes: 5,
      },
      {
        id: '2',
        author: 'Elena Rostova',
        avatar: 'E',
        role: 'Staff DevOps Lead',
        time: '11:15 AM',
        content: 'Staging cluster deployment pipeline is green. Remember that all attendance geofence tokens are rotated weekly.',
        likes: 3,
      },
    ],
    hr: [
      {
        id: '3',
        author: 'Sarah Jenkins',
        avatar: 'S',
        role: 'Director of People',
        time: '9:00 AM',
        content: 'Q4 Performance appraisals will open next Monday. Please review the updated handbook on the Documents tab.',
        likes: 8,
      },
    ],
    finance: [
      {
        id: '4',
        author: 'David Sterling',
        avatar: 'D',
        role: 'Head of FP&A',
        time: 'Yesterday',
        content: 'All departmental travel and equipment expense claims must be logged before the 28th for monthly payroll reconciliation.',
        likes: 4,
      },
    ],
    governance: [
      {
        id: '5',
        author: 'AM DEV Executive Board',
        avatar: 'A',
        role: 'Corporate Ops',
        time: 'Oct 18',
        content: 'All-Hands Global Townhall will be held virtually this Thursday. Agenda items include annual revenue growth and hybrid expansion.',
        likes: 12,
      },
    ],
  });

  const documents: Record<string, DocumentItem[]> = {
    engineering: [
      { id: 'e1', name: 'AMDEV_System_Architecture_v2.pdf', type: 'PDF', size: '4.2 MB', updatedAt: 'Oct 19, 2026', author: 'Architecture Board' },
      { id: 'e2', name: 'OpenAPI_v1_REST_Specification.json', type: 'JSON', size: '380 KB', updatedAt: 'Oct 20, 2026', author: 'Core API Team' },
      { id: 'e3', name: 'Security_Threat_Model_Matrix.xlsx', type: 'XLSX', size: '1.1 MB', updatedAt: 'Oct 15, 2026', author: 'SecOps Team' },
      { id: 'e4', name: 'Zero_Trust_Geofencing_Standard.pdf', type: 'PDF', size: '2.8 MB', updatedAt: 'Oct 10, 2026', author: 'Security Lead' },
    ],
    hr: [
      { id: 'h1', name: 'AM_DEV_Employee_Handbook_2026.pdf', type: 'PDF', size: '5.6 MB', updatedAt: 'Sep 30, 2026', author: 'People Team' },
      { id: 'h2', name: 'Hybrid_Workplace_Policy_Addendum.docx', type: 'DOCX', size: '890 KB', updatedAt: 'Oct 05, 2026', author: 'HR Legal' },
      { id: 'h3', name: 'Healthcare_and_Wellness_Benefits.pdf', type: 'PDF', size: '3.1 MB', updatedAt: 'Sep 15, 2026', author: 'Total Rewards' },
    ],
    finance: [
      { id: 'f1', name: 'Corporate_Expense_Reimbursement_Policy.pdf', type: 'PDF', size: '1.4 MB', updatedAt: 'Oct 01, 2026', author: 'Finance Dept' },
      { id: 'f2', name: 'Q4_Departmental_Budget_Allocations.xlsx', type: 'XLSX', size: '2.3 MB', updatedAt: 'Oct 18, 2026', author: 'FP&A Lead' },
    ],
    governance: [
      { id: 'g1', name: 'Townhall_Q3_Recap_Presentation.pdf', type: 'PDF', size: '14.2 MB', updatedAt: 'Oct 12, 2026', author: 'Executive Office' },
      { id: 'g2', name: 'Corporate_Code_of_Ethics_and_Conduct.pdf', type: 'PDF', size: '2.1 MB', updatedAt: 'Jan 10, 2026', author: 'Legal Counsel' },
    ],
  };

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newMsg: ChannelMessage = {
      id: Date.now().toString(),
      author: user?.profile?.displayName || `${user?.profile?.firstName || 'Colleague'} ${user?.profile?.lastName || ''}`.trim(),
      avatar: user?.profile?.firstName?.[0] || 'U',
      role: user?.roles?.[0] || 'Team Member',
      time: 'Just now',
      content: newPostContent,
      likes: 0,
    };

    setMessages((prev) => ({
      ...prev,
      [activeTab]: [newMsg, ...(prev[activeTab] || [])],
    }));
    setNewPostContent('');
  };

  const currentDocs = (documents[activeTab] || []).filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* SharePoint / Teams Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              SharePoint Teams Portal
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Departmental Workspaces</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cross-functional knowledge repositories, document libraries, and departmental conversation feeds.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSearchParams({ tab: 'engineering' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'engineering'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Engineering
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'hr' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'hr'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Human Resources
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'finance' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'finance'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Finance & Legal
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'governance' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'governance'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Ops Governance
          </button>
        </div>
      </div>

      {/* Workspace Body: Split View (Documents vs Channel Conversations) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Documents Library (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Document Library & Architecture Files</span>
                </h2>
                <p className="text-xs text-slate-400">Official assets and guidelines for {activeTab.toUpperCase()}</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {currentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium flex items-center gap-2.5">
                        <span className="p-1 rounded bg-slate-800 text-blue-400 font-mono text-[9px] font-bold">
                          {doc.type}
                        </span>
                        <span className="text-white hover:text-blue-400 cursor-pointer">{doc.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{doc.size}</td>
                      <td className="py-3 px-4 text-slate-400">{doc.updatedAt}</td>
                      <td className="py-3 px-4 text-slate-300">{doc.author}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => alert(`Downloading ${doc.name}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Download Asset"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Microsoft Teams Style Channel Feed (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[560px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  #{activeTab}-general channel
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Teams Synchronized</span>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {(messages[activeTab] || []).map((msg) => (
                <div key={msg.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 font-bold text-[10px] flex items-center justify-center uppercase">
                        {msg.avatar}
                      </div>
                      <span className="text-xs font-bold text-white">{msg.author}</span>
                      <span className="text-[9px] text-slate-400">{msg.role}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">{msg.content}</p>
                </div>
              ))}
            </div>

            {/* Message composer */}
            <form onSubmit={handlePostMessage} className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Post update to #${activeTab}-general...`}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
