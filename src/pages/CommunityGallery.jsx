import React, { useState, useEffect, useCallback } from 'react';
import PullToRefresh from '../components/ui/PullToRefresh';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Upload, MapPin, Camera, MessageSquare, X, Loader2, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function CommunityGallery() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [form, setForm] = useState({ caption: '', location: '', camera_settings: '' });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const gallery = await base44.entities.GalleryPost.list('-created_date', 50);
    setPosts(gallery);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const post = await base44.entities.GalleryPost.create({
      user_email: user.email,
      user_name: user.full_name || user.email.split('@')[0],
      photo_url: file_url,
      caption: form.caption,
      location: form.location,
      camera_settings: form.camera_settings,
      likes: 0,
      liked_by: [],
    });
    setPosts([post, ...posts]);
    setShowUpload(false);
    setForm({ caption: '', location: '', camera_settings: '' });
    setFile(null);
    setFilePreview(null);
    setUploading(false);
  };

  const handleLike = async (post) => {
    const liked = post.liked_by?.includes(user.email);
    const newLikedBy = liked
      ? (post.liked_by || []).filter(e => e !== user.email)
      : [...(post.liked_by || []), user.email];
    // Optimistic update
    const optimistic = { ...post, likes: newLikedBy.length, liked_by: newLikedBy };
    setPosts(prev => prev.map(p => p.id === post.id ? optimistic : p));
    if (selectedPost?.id === post.id) setSelectedPost(optimistic);
    base44.entities.GalleryPost.update(post.id, { likes: newLikedBy.length, liked_by: newLikedBy });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Camera className="w-10 h-10 text-purple-400 star-pulse" />
    </div>
  );

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Community Gallery</h1>
          <p className="text-slate-400 text-lg">Share your shots, inspire others, get feedback.</p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
          onClick={() => setShowUpload(true)}
        >
          <Upload className="w-4 h-4 mr-2" /> Share a Photo
        </Button>
      </div>

      {/* Gallery Grid */}
      {posts.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800 p-16 text-center">
          <Camera className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-500 mb-2">No photos yet</h3>
          <p className="text-slate-600 mb-6">Be the first to share a Milky Way photo!</p>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Your First Photo
          </Button>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {posts.map(post => {
            const isLiked = post.liked_by?.includes(user?.email);
            return (
              <div key={post.id} className="break-inside-avoid">
                <Card className="bg-slate-900/60 border-slate-800 overflow-hidden card-glow group">
                  <div className="relative cursor-pointer" onClick={() => setSelectedPost(post)}>
                    <img
                      src={post.photo_url}
                      alt={post.caption || 'Gallery photo'}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {post.is_featured && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-white font-medium text-sm">{post.user_name || post.user_email?.split('@')[0]}</p>
                        <p className="text-slate-500 text-xs">{format(new Date(post.created_date), 'MMM d, yyyy')}</p>
                      </div>
                      <button
                        onClick={() => handleLike(post)}
                        className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post.likes || 0}</span>
                      </button>
                    </div>

                    {post.caption && <p className="text-slate-300 text-sm mb-2 line-clamp-2">{post.caption}</p>}

                    <div className="flex flex-wrap gap-2">
                      {post.location && (
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                          <MapPin className="w-3 h-3 mr-1" />{post.location}
                        </Badge>
                      )}
                      {post.camera_settings && (
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                          <Camera className="w-3 h-3 mr-1" />{post.camera_settings}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Share Your Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div>
              <Label className="text-slate-300 mb-2 block">Photo *</Label>
              {filePreview ? (
                <div className="relative">
                  <img src={filePreview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
                  <button onClick={() => { setFile(null); setFilePreview(null); }} className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-slate-500 text-sm">Click to select a photo</p>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Caption</Label>
              <Textarea
                placeholder="Describe your shot, tell the story..."
                value={form.caption}
                onChange={e => setForm({ ...form, caption: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 mb-2 block">Location</Label>
                <Input
                  placeholder="e.g. Death Valley"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Camera Settings</Label>
                <Input
                  placeholder="e.g. f/2.8, ISO 3200, 20s"
                  value={form.camera_settings}
                  onChange={e => setForm({ ...form, camera_settings: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-purple-600 hover:bg-purple-700 h-11"
            >
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Share Photo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl p-0 overflow-hidden">
            <img src={selectedPost.photo_url} alt={selectedPost.caption} className="w-full max-h-[60vh] object-contain bg-black" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{selectedPost.user_name}</p>
                  <p className="text-slate-500 text-sm">{format(new Date(selectedPost.created_date), 'MMMM d, yyyy')}</p>
                </div>
                <button onClick={() => handleLike(selectedPost)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${selectedPost.liked_by?.includes(user?.email) ? 'bg-red-600/20 text-red-400' : 'bg-slate-800 text-slate-400 hover:text-red-400'}`}>
                  <Heart className={`w-4 h-4 ${selectedPost.liked_by?.includes(user?.email) ? 'fill-current' : ''}`} />
                  {selectedPost.likes || 0}
                </button>
              </div>
              {selectedPost.caption && <p className="text-slate-300 mb-3">{selectedPost.caption}</p>}
              <div className="flex flex-wrap gap-2">
                {selectedPost.location && <Badge variant="outline" className="border-slate-700 text-slate-400"><MapPin className="w-3 h-3 mr-1" />{selectedPost.location}</Badge>}
                {selectedPost.camera_settings && <Badge variant="outline" className="border-slate-700 text-slate-400"><Camera className="w-3 h-3 mr-1" />{selectedPost.camera_settings}</Badge>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </PullToRefresh>
  );
}