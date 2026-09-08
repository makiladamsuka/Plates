import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Camera, 
  Copy, 
  Check, 
  Share2, 
  RotateCcw, 
  Upload, 
  AlertCircle, 
  UserPlus 
} from 'lucide-react';
import { QRCodeSVG } from '../utils/qrCode';
import { 
  QrScannerManager, 
  type ParsedFriendQr 
} from '../utils/qrScanner';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';

interface FriendQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  addedFriendIds: string[];
  onSendFriendRequest: (friendId: string) => Promise<void>;
}

export function FriendQrModal({
  isOpen,
  onClose,
  currentUser,
  addedFriendIds,
  onSendFriendRequest,
}: FriendQrModalProps) {
  const [activeTab, setActiveTab] = useState<'my-code' | 'scan'>('my-code');
  const [isCopied, setIsCopied] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ParsedFriendQr | null>(null);
  const [scannedProfile, setScannedProfile] = useState<{
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerManagerRef = useRef<QrScannerManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deep-link / Shareable Invite URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://plates.live';
  const qrPayload = `${origin}/invite?friendId=${currentUser.id}&username=${encodeURIComponent(
    currentUser.username || ''
  )}&name=${encodeURIComponent(currentUser.full_name || '')}`;

  // Initialize or cleanup scanner when tab switches or modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      cleanupCamera();
      setScannedResult(null);
      setScannedProfile(null);
      setRequestSentSuccess(false);
      return;
    }

    if (activeTab === 'scan' && !scannedResult) {
      startCamera();
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [isOpen, activeTab, scannedResult]);

  const cleanupCamera = () => {
    if (scannerManagerRef.current) {
      scannerManagerRef.current.stop();
      scannerManagerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(false);

    // Short timeout to ensure video element is rendered and mounted in DOM
    setTimeout(async () => {
      if (!videoRef.current) return;

      try {
        const manager = new QrScannerManager((detected) => {
          handleDetectedQr(detected);
        });
        scannerManagerRef.current = manager;

        await manager.start(videoRef.current, 'environment');
        setIsCameraActive(true);
      } catch (err: any) {
        console.error('Camera initialization error:', err);
        setIsCameraActive(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera permission was denied. Please allow camera access in browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera detected on this device.');
        } else {
          setCameraError(err.message || 'Unable to access camera.');
        }
      }
    }, 150);
  };

  const handleFlipCamera = async () => {
    if (scannerManagerRef.current) {
      try {
        await scannerManagerRef.current.toggleCamera();
      } catch (e: any) {
        console.warn('Flip camera error:', e);
      }
    }
  };

  const handleDetectedQr = async (payload: ParsedFriendQr) => {
    cleanupCamera();
    setScannedResult(payload);
    setRequestSentSuccess(false);

    if (payload.friendId === currentUser.id) {
      // User scanned their own code
      setScannedProfile({
        id: currentUser.id,
        full_name: currentUser.full_name || 'You',
        username: currentUser.username || '',
        avatar_url: currentUser.avatar_url || '',
      });
      return;
    }

    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', payload.friendId)
        .single();

      if (error || !data) {
        // Fallback to parsed metadata from the QR code
        setScannedProfile({
          id: payload.friendId,
          full_name: payload.name || 'Plates User',
          username: payload.username || '',
          avatar_url: '',
        });
      } else {
        setScannedProfile(data);
      }
    } catch (e) {
      setScannedProfile({
        id: payload.friendId,
        full_name: payload.name || 'Plates User',
        username: payload.username || '',
        avatar_url: '',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const manager = new QrScannerManager((detected) => handleDetectedQr(detected));
      const detected = await manager.scanFile(file);
      if (detected) {
        handleDetectedQr(detected);
      } else {
        alert('Could not find a valid QR code in this image. Please try another image.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to scan image.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert(qrPayload);
    }
  };

  const handleShare = async () => {
    const shareText = `Add me on Plates! My username is @${currentUser.username || currentUser.full_name}: ${qrPayload}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Add me on Plates',
          text: shareText,
          url: qrPayload,
        });
        return;
      } catch {}
    }
    handleCopyLink();
  };

  const handleConfirmAddFriend = async () => {
    if (!scannedProfile) return;
    setIsSendingRequest(true);
    try {
      await onSendFriendRequest(scannedProfile.id);
      setRequestSentSuccess(true);
    } catch (err) {
      console.error('Error adding scanned friend:', err);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleResetScan = () => {
    setScannedResult(null);
    setScannedProfile(null);
    setRequestSentSuccess(false);
    startCamera();
  };

  if (!isOpen) return null;

  const isSelf = scannedProfile?.id === currentUser.id;
  const isAlreadyFriend = scannedProfile ? addedFriendIds.includes(scannedProfile.id) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-['Sora']">
      
      {/* Centered Modal Card */}
      <div 
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[35px] p-6 relative shadow-2xl border border-black/5 dark:border-white/5 flex flex-col items-center transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar: Title & Close */}
        <div className="w-full flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
            Connect via QR
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-zinc-400 cursor-pointer transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Segmented Tab Switch */}
        <div className="w-full flex bg-[#D9D9D9]/70 dark:bg-zinc-800/70 p-1 rounded-[25px] mb-5 border border-transparent dark:border-white/5">
          <button
            onClick={() => {
              setActiveTab('my-code');
              setScannedResult(null);
            }}
            className={`flex-1 py-2 rounded-[20px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'my-code'
                ? 'bg-[#1A1A1A] text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                : 'text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <QrCode size={15} />
            <span>My QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 rounded-[20px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-[#1A1A1A] text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                : 'text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Camera size={15} />
            <span>Scan Camera</span>
          </button>
        </div>

        {/* ─── TAB 1: MY QR CODE ─── */}
        {activeTab === 'my-code' && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar 
                src={currentUser.avatar_url} 
                name={currentUser.full_name || currentUser.username} 
                className="w-12 h-12 border-2 border-white dark:border-zinc-800 shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-[#1A1A1A] dark:text-zinc-100 font-bold text-[15px] leading-tight">
                  {currentUser.full_name || 'Plates User'}
                </span>
                <span className="text-black/50 dark:text-zinc-400 text-xs font-light">
                  {currentUser.username ? `@${currentUser.username}` : 'Plates Member'}
                </span>
              </div>
            </div>

            {/* QR Card Container with Center Logo & Bold Black Style */}
            <div className="p-3.5 bg-white rounded-[26px] shadow-md border border-black/5 flex flex-col items-center mb-4 transition-transform hover:scale-[1.01]">
              <QRCodeSVG 
                value={qrPayload} 
                size={225} 
                fgColor="#000000"
                bgColor="#FFFFFF"
                logoUrl={currentUser.avatar_url || '/logo.svg'}
              />
            </div>

            <p className="text-black/60 dark:text-zinc-400 text-[11px] text-center mb-5 max-w-[280px]">
              Ask your friend to point their camera at this code to instantly send a friend request.
            </p>

            {/* Action Buttons: Copy Link & Share */}
            <div className="w-full flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[#1A1A1A] dark:text-zinc-100 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check size={14} className="text-[#4C8C3C]" strokeWidth={2.5} />
                    <span className="text-[#4C8C3C]">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex-1 py-2.5 px-3 rounded-full bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#333] dark:hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Share2 size={14} />
                <span>Share Code</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SCAN CAMERA ─── */}
        {activeTab === 'scan' && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200 relative z-10">
            
            {/* Scanned Result Card */}
            {scannedResult ? (
              <div className="w-full flex flex-col items-center py-4">
                {isLoadingProfile ? (
                  <div className="py-12 text-sm text-black/50 dark:text-zinc-400 font-light flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#1A1A1A] dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
                    <span>Loading profile...</span>
                  </div>
                ) : scannedProfile ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative mb-3">
                      <Avatar 
                        src={scannedProfile.avatar_url} 
                        name={scannedProfile.full_name || scannedProfile.username} 
                        className="w-20 h-20 border-4 border-white dark:border-zinc-800 shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#4C8C3C] text-white flex items-center justify-center shadow-xs">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>

                    <h4 className="text-[#1A1A1A] dark:text-zinc-100 font-bold text-base text-center">
                      {scannedProfile.full_name}
                    </h4>
                    <p className="text-black/50 dark:text-zinc-400 text-xs mb-5">
                      {scannedProfile.username ? `@${scannedProfile.username}` : ''}
                    </p>

                    {isSelf ? (
                      <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs px-4 py-2 rounded-full font-medium mb-4">
                        That's your own QR code!
                      </div>
                    ) : isAlreadyFriend || requestSentSuccess ? (
                      <div className="bg-[#4C8C3C]/15 text-[#4C8C3C] dark:text-[#5FAD4B] text-xs px-4 py-2.5 rounded-full font-semibold mb-4 flex items-center gap-1.5">
                        <Check size={14} strokeWidth={2.5} />
                        <span>{requestSentSuccess ? 'Friend Request Sent!' : 'Already Connected'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleConfirmAddFriend}
                        disabled={isSendingRequest}
                        className="w-full py-3 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#333] dark:hover:bg-white/90 active:scale-98 transition-all cursor-pointer shadow-md mb-3"
                      >
                        {isSendingRequest ? (
                          <div className="w-4 h-4 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus size={16} />
                            <span>Send Friend Request</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleResetScan}
                      className="text-xs text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1.5 font-medium cursor-pointer transition-colors py-1"
                    >
                      <RotateCcw size={13} />
                      <span>Scan another code</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              /* Camera Viewfinder */
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full h-[250px] bg-black rounded-[24px] overflow-hidden flex items-center justify-center shadow-inner">
                  
                  {/* Native Video Stream */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />

                  {/* Camera Error Display */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center z-20">
                      <AlertCircle size={32} className="text-amber-400 mb-2" />
                      <p className="text-white/90 text-xs font-normal mb-3 max-w-[240px]">
                        {cameraError}
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white text-zinc-900 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                      >
                        <Upload size={14} />
                        <span>Upload QR Image</span>
                      </button>
                    </div>
                  )}

                  {/* Scanning Overlay (Minimal Viewfinder Frame) */}
                  {!cameraError && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-[180px] h-[180px] border border-white/20 rounded-[20px]">
                        
                        {/* 4 Corner Markers */}
                        <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-[8px]" />
                        <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-[8px]" />
                        <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-[8px]" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-[8px]" />
                      </div>
                    </div>
                  )}

                  {/* Flip Camera Button (top-right of viewfinder) */}
                  {isCameraActive && (
                    <button
                      onClick={handleFlipCamera}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer z-10"
                      title="Flip Camera"
                    >
                      <RotateCcw size={15} />
                    </button>
                  )}
                </div>

                {/* Subtitle & File Upload Alternative */}
                <div className="w-full flex items-center justify-between mt-3 px-1">
                  <span className="text-black/50 dark:text-zinc-400 text-[11px]">
                    Point camera at friend's Plates QR code
                  </span>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-[#1A1A1A] dark:text-zinc-200 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload size={12} />
                    <span>Upload photo</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
