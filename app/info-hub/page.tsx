"use client";

import { useState, useEffect } from "react";
import { BookOpen, Phone, FileText, UserCircle, Search as SearchIcon, ExternalLink, Mail, Smartphone } from "lucide-react";

interface InfoItem {
  id: number;
  category: string;
  title: string;
  description: string;
  contact_info: string;
  action_link: string;
  action_text: string;
}

export default function InfoHubPage() {
  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_info_hub.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItems(data.items);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const procedures = filteredItems.filter(i => i.category === 'procedure');
  const hotlines = filteredItems.filter(i => i.category === 'hotline');
  const contacts = filteredItems.filter(i => i.category === 'contact');

  return (
    <div className="container py-8 relative min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex justify-center items-center gap-3">
          <BookOpen size={36} style={{ color: '#ec4899' }} />
          Information Hub
        </h1>
        <p className="text-muted max-w-2xl mx-auto mb-8">
          Your primary point of reference for all university procedures, contacts, and emergency information.
        </p>

        <div className="max-w-xl mx-auto relative">
          <SearchIcon size={20} className="text-muted" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            className="form-input text-lg" 
            style={{ paddingLeft: "3rem", borderRadius: "2rem", backgroundColor: "var(--background)" }} 
            placeholder="Search procedures or contacts..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading information...</div>
      ) : (
        <div className="grid grid-cols-1 md-grid-cols-3 gap-8">
          
          {/* Procedures Section */}
          <div className="md-grid-cols-2" style={{ gridColumn: 'span 2' }}>
            <div className="flex items-center gap-2 mb-6 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
              <FileText size={24} style={{ color: '#ec4899' }} />
              <h2 className="text-2xl font-bold">University Procedures</h2>
            </div>
            
            {procedures.length === 0 ? (
              <div className="text-muted italic py-4">No procedures found.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {procedures.map(proc => (
                  <div key={proc.id} className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ec4899' }}>
                    <h3 className="font-bold text-xl mb-2">{proc.title}</h3>
                    <p className="text-sm text-muted mb-4 leading-relaxed whitespace-pre-wrap">
                      {proc.description}
                    </p>
                    {proc.action_text && proc.action_link && (
                      <a href={proc.action_link} target="_blank" rel="noreferrer" className="btn btn-secondary text-sm inline-flex items-center gap-2" style={{ padding: '0.4rem 1rem' }}>
                        <ExternalLink size={14} />
                        {proc.action_text}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contacts Section */}
          <div className="flex flex-col gap-8">
            
            <div>
              <div className="flex items-center gap-2 mb-6 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <Phone size={24} className="text-danger" />
                <h2 className="text-2xl font-bold">Emergency Hotlines</h2>
              </div>
              
              {hotlines.length === 0 ? (
                <div className="text-muted italic py-4">No hotlines found.</div>
              ) : (
                <div className="card" style={{ borderLeft: '4px solid var(--danger)', padding: '1rem' }}>
                  <div className="flex flex-col gap-3">
                    {hotlines.map((hotline, idx) => (
                      <div key={hotline.id} className={`flex justify-between items-center ${idx !== hotlines.length - 1 ? 'border-b border-border pb-3' : ''}`}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{hotline.title}</span>
                          {hotline.description && <span className="text-xs text-muted">{hotline.description}</span>}
                        </div>
                        <a href={`tel:${hotline.contact_info}`} className="text-danger font-mono font-bold flex items-center gap-2 bg-danger/10 px-3 py-1 rounded-full hover:bg-danger/20 transition">
                          <Smartphone size={14} /> {hotline.contact_info}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <UserCircle size={24} className="text-primary" />
                <h2 className="text-2xl font-bold">Key Contacts</h2>
              </div>

              {contacts.length === 0 ? (
                <div className="text-muted italic py-4">No contacts found.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {contacts.map(contact => (
                    <div key={contact.id} className="card p-4 hover:border-primary transition-colors cursor-default">
                      <div className="font-bold text-lg mb-1">{contact.title}</div>
                      <div className="text-sm text-muted mb-3">{contact.description}</div>
                      
                      {contact.contact_info && (
                        <div className="flex items-center gap-2 text-sm">
                          {contact.contact_info.includes('@') ? (
                            <a href={`mailto:${contact.contact_info}`} className="flex items-center gap-2 text-primary hover:underline">
                              <Mail size={14} /> {contact.contact_info}
                            </a>
                          ) : (
                            <a href={`tel:${contact.contact_info}`} className="flex items-center gap-2 text-primary hover:underline">
                              <Phone size={14} /> {contact.contact_info}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
