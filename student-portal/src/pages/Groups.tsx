// ============================================
// Student Portal - Groups Page
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, LoadingSpinner, EmptyState } from '../components/Layout';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================
interface Group {
    id: string;
    class_subject_id: string;
    class_id: string;
    name: string;
    subject_name: string;
    subject_code: string;
    class_label: string;
    member_count: number;
    professor_name: string;
    unread_count: number;
    type: string;
}

interface Message {
    id: string;
    content: string;
    type: string;
    created_at: string;
    sender: {
        id: string;
        name: string;
        role: string;
    };
}

// ============================================
// API & Supabase Configuration
// ============================================
const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ============================================
// Group List Component
// ============================================
interface GroupListProps {
    onSelectGroup: (group: Group) => void;
}

function GroupList({ onSelectGroup }: GroupListProps) {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, [user]);

    const fetchGroups = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/groups?user_id=${user.id}&role=student`);
            const data = await response.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <EmptyState
                icon={
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                }
                title="No groups yet"
                description="Subject groups will appear here when you're enrolled in classes."
            />
        );
    }

    return (
        <div className="space-y-3">
            {groups.map((group) => (
                <Card
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className="cursor-pointer hover:border-accent-teal/50 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-text-primary truncate">
                                    {group.subject_name}
                                </h3>
                            </div>
                            <p className="text-sm text-text-secondary">{group.class_label}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-text-muted">
                                    {group.professor_name && `Prof. ${group.professor_name}`}
                                </span>
                                <span className="text-xs text-text-muted">•</span>
                                <span className="text-xs text-text-muted">
                                    {group.member_count} members
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {group.unread_count > 0 && (
                                <span className="w-5 h-5 rounded-full bg-accent-teal text-white text-xs flex items-center justify-center">
                                    {group.unread_count}
                                </span>
                            )}
                            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// ============================================
// Chat Component
// ============================================
interface ChatProps {
    group: Group;
    onBack: () => void;
}

function Chat({ group, onBack }: ChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();

        // Subscribe to realtime updates
        if (supabase) {
            const channel = supabase
                .channel(`group-${group.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'group_messages',
                        filter: `group_id=eq.${group.id}`,
                    },
                    () => {
                        fetchMessages();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
        return undefined;
    }, [group]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_BASE}/groups/${group.id}/messages`);
            const data = await response.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !user) return;

        setSending(true);
        try {
            const response = await fetch(`${API_BASE}/groups/${group.id}/messages?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage.trim() }),
            });
            const data = await response.json();

            if (data.success) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-bg-secondary">
                <button onClick={onBack} className="p-2 -ml-2 text-text-secondary hover:text-text-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-text-primary truncate">{group.subject_name}</h2>
                    <p className="text-xs text-text-secondary">
                        {group.class_label} • {group.member_count} members
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-text-secondary">No messages yet</p>
                        <p className="text-text-muted text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => {
                            const isOwn = message.sender.id === user?.id;
                            const isProfessor = message.sender.role === 'professor';

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${isOwn
                                            ? 'bg-accent-teal text-white rounded-br-md'
                                            : 'bg-bg-secondary text-text-primary rounded-bl-md'
                                            } ${isProfessor && !isOwn ? 'border border-primary/30' : ''}`}
                                    >
                                        {!isOwn && (
                                            <p className={`text-xs font-medium mb-1 ${isProfessor ? 'text-primary' : 'text-text-secondary'
                                                }`}>
                                                {message.sender.name}
                                                {isProfessor && (
                                                    <span className="ml-1 text-xs opacity-75">(Prof)</span>
                                                )}
                                            </p>
                                        )}
                                        <p className="text-sm">{message.content}</p>
                                        <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-text-muted'}`}>
                                            {formatTime(message.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-bg-secondary safe-area-bottom">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-full bg-bg-tertiary border border-white/10 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-teal"
                        disabled={sending}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 rounded-full bg-accent-teal text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {sending ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main Groups Component
// ============================================
export default function Groups() {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    if (selectedGroup) {
        return (
            <PageContainer noPadding noBottomNav>
                <Chat
                    group={selectedGroup}
                    onBack={() => setSelectedGroup(null)}
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer
            header={<Header title="Groups" />}
        >
            <GroupList onSelectGroup={setSelectedGroup} />
        </PageContainer>
    );
}
