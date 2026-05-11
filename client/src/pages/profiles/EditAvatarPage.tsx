import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { ParentLoader } from '@/components/loaders';
import { AvatarManager } from '@/components/avatar/AvatarManager';
import { childService } from '../../services/childService';
import type { IChild } from '@mathmagic/types';

export default function EditAvatarPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<IChild | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;
    childService
      .getOne(childId)
      .then(setChild)
      .catch(() => {
        toast.error('Profile not found');
        navigate('/profiles');
      })
      .finally(() => setIsLoading(false));
  }, [childId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <ParentLoader message="Loading…" />
      </div>
    );
  }

  if (!child) return null;

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-6">
      <div className="w-full max-w-sm">
        <Link
          to="/profiles"
          className="inline-flex items-center gap-1 text-sm text-purple-wizzy hover:text-purple-wizzy/80 transition-colors font-medium mb-6"
        >
          <ArrowLeft size={15} />
          Back to Profiles
        </Link>

        <h1 className="text-2xl font-bold text-purple-wizzy mb-1">{child.name}'s Avatar</h1>
        <p className="text-sm text-gray-400 mb-6">Describe your character and bring it to life!</p>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AvatarManager child={child} onChildUpdated={setChild} />
        </div>
      </div>
    </div>
  );
}
