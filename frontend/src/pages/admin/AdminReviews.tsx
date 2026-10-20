import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle, 
  EyeOff, 
  AlertCircle, 
  Filter, 
  MessageSquare, 
  User, 
  Calendar 
} from 'lucide-react';
import api from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { FullPageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

interface AdminReview {
  id: string;
  product_id: string;
  product_name: string;
  user_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = filterStatus ? `/admin/reviews?status=${filterStatus}` : '/admin/reviews';
      const res = await api.get(url);
      setReviews(res.data.reviews);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterStatus]);

  const handleModerate = async (id: string, newStatus: 'approved' | 'hidden') => {
    try {
      await api.patch(`/admin/reviews/${id}/moderate`, { status: newStatus });
      toast.success(`Review ${newStatus === 'approved' ? 'approved' : 'hidden'}`);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update review status');
    }
  };

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Star className="w-6 h-6 text-orange-500 fill-orange-500/20" />
            <span>Product Reviews & Moderation</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Moderate customer feedback, approve genuine reviews, and update product aggregate ratings
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{pendingCount} review(s) awaiting moderation</span>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </span>
          {['', 'pending', 'approved', 'hidden'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === status
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-navy-700/60 text-gray-300 hover:text-white hover:bg-navy-700'
              }`}
            >
              {status === '' ? 'All Reviews' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <FullPageSpinner />
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No customer reviews found matching filter.
          </div>
        ) : (
          <div className="divide-y divide-navy-700/60">
            {reviews.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-navy-700/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white text-sm">{r.product_name}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      r.status === 'approved' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : r.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= r.rating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-white ml-1.5">{r.title}</span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed mb-3">
                    {r.body}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span>{r.reviewer_name} ({r.reviewer_email})</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span>{formatDateTime(r.created_at)}</span>
                    </span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => handleModerate(r.id, 'approved')}
                      className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700 shadow-none"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {r.status !== 'hidden' && (
                    <button
                      onClick={() => handleModerate(r.id, 'hidden')}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 text-gray-300 hover:text-white"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
