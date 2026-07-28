'use client';

import { applyToSell, MyVerification } from '@/app/actions/verificationActions';
import { captureVideoFrame, fileToDataUri } from '@/lib/captureImage';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiBadgeCheck, HiCamera, HiClock, HiOutlineIdentification, HiRefresh, HiUpload } from 'react-icons/hi';

type Props = { initial: MyVerification };
type Step = 'intro' | 'selfie' | 'id' | 'review';
const ID_TYPES = ['Passport', "Driver's License", 'National ID'];

export default function VerifyFlow({ initial }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const app = initial.application;
  const isRejected = app?.status === 'Rejected';
  const isPending = app?.status === 'Pending';

  // Verified and pending are terminal here; a rejected user falls through to the
  // wizard to re-apply (with the reason shown).
  if (initial.verified) return <VerifiedState />;
  if (isPending) return <PendingState />;

  return (
    <Wizard
      rejectedReason={isRejected ? app?.rejectionReason : undefined}
      onDone={() => router.push('/verify')}
      reduce={!!reduce}
    />
  );
}

/* ─────────────────────────── Terminal states ─────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md px-1 py-6">{children}</div>;
}

function VerifiedState() {
  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-8 text-center shadow-lot"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
        >
          <HiBadgeCheck className="mx-auto h-16 w-16 text-sky-500" />
        </motion.div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">You&apos;re a verified auctioneer</h1>
        <p className="mt-2 text-sm text-asphalt">
          The blue tick now shows next to your name. You can list cars for auction.
        </p>
        <Link href="/auctions/create" className="btn-primary mt-6 inline-block">List a car</Link>
      </motion.div>
    </Shell>
  );
}

function PendingState() {
  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center shadow-lot"
      >
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <HiClock className="mx-auto h-14 w-14 text-amber-500" />
        </motion.div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Under review</h1>
        <p className="mt-2 text-sm text-asphalt">
          Our team is reviewing your identity documents. You&apos;ll get the blue tick as soon as
          you&apos;re approved — usually within a day.
        </p>
        <Link href="/" className="btn-ghost mt-6 inline-block">Browse auctions meanwhile</Link>
      </motion.div>
    </Shell>
  );
}

/* ─────────────────────────────── Wizard ──────────────────────────────── */

function Wizard({
  rejectedReason,
  onDone,
  reduce,
}: {
  rejectedReason?: string;
  onDone: () => void;
  reduce: boolean;
}) {
  const [step, setStep] = useState<Step>('intro');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (facingMode: 'user' | 'environment') => {
      setCamError(null);
      try {
        stopCamera();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCamError('Camera unavailable. Grant camera access, or upload a photo instead.');
      }
    },
    [stopCamera]
  );

  // Start/stop the camera as the capture steps come and go.
  useEffect(() => {
    if (step === 'selfie' && !selfie) startCamera('user');
    else if (step === 'id' && !idImage) startCamera('environment');
    else stopCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function snap(target: 'selfie' | 'id') {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const uri = captureVideoFrame(video);
    if (target === 'selfie') setSelfie(uri);
    else setIdImage(uri);
    stopCamera();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIdImage(await fileToDataUri(file));
      stopCamera();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read that image');
    }
  }

  async function submit() {
    if (!selfie || !idImage) return;
    setSubmitting(true);
    try {
      const res = await applyToSell({ idType, selfieImage: selfie, idImage });
      if ('error' in res) throw new Error(res.error.message);
      toast.success('Application submitted for review');
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit your application');
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = { intro: 0, selfie: 1, id: 2, review: 3 }[step];

  return (
    <Shell>
      {/* Progress */}
      <div className="mb-5 flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 flex-1 rounded-full"
            animate={{ backgroundColor: i <= stepIndex ? '#e11d2a' : 'rgba(0,0,0,0.10)' }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 'intro' && (
            <div className="rounded-2xl border border-chrome/80 bg-paper-raised p-6 shadow-lot">
              <HiOutlineIdentification className="h-12 w-12 text-redline" />
              <h1 className="mt-3 font-display text-2xl font-bold text-ink">Verify to sell</h1>
              <p className="mt-2 text-sm leading-relaxed text-asphalt">
                To protect buyers, sellers are identity-verified before listing a car. It takes a
                minute: a quick selfie and a photo of your ID. An admin reviews it, then you get the
                blue tick.
              </p>
              {rejectedReason && (
                <p className="mt-3 rounded-lg border border-redline/30 bg-redline/5 p-3 text-sm text-redline">
                  Your last application was declined: {rejectedReason}
                </p>
              )}
              <p className="mt-3 text-xs text-chrome-dark">
                Your documents are used only for verification and reviewed by our team. See our{' '}
                <Link href="/privacy" className="text-redline hover:underline">Privacy Policy</Link>.
              </p>
              <button onClick={() => setStep('selfie')} className="btn-primary mt-6 w-full">
                Start verification
              </button>
            </div>
          )}

          {step === 'selfie' && (
            <CaptureCard
              title="Take a selfie"
              hint="Center your face in the frame and look at the camera."
              image={selfie}
              camError={camError}
              videoRef={videoRef}
              onSnap={() => snap('selfie')}
              onRetake={() => { setSelfie(null); startCamera('user'); }}
              onBack={() => setStep('intro')}
              onNext={() => setStep('id')}
              nextEnabled={!!selfie}
              rounded
            />
          )}

          {step === 'id' && (
            <div>
              <div className="mb-3">
                <label className="field-label">ID document type</label>
                <select value={idType} onChange={(e) => setIdType(e.target.value)} className="field-input">
                  {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <CaptureCard
                title={`Photograph your ${idType}`}
                hint="Make sure all four corners and the text are readable."
                image={idImage}
                camError={camError}
                videoRef={videoRef}
                onSnap={() => snap('id')}
                onRetake={() => { setIdImage(null); startCamera('environment'); }}
                onBack={() => setStep('selfie')}
                onNext={() => setStep('review')}
                nextEnabled={!!idImage}
                uploadSlot={
                  <label className="btn-ghost flex cursor-pointer items-center justify-center gap-2">
                    <HiUpload /> Upload instead
                    <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                  </label>
                }
              />
            </div>
          )}

          {step === 'review' && (
            <div className="rounded-2xl border border-chrome/80 bg-paper-raised p-6 shadow-lot">
              <h1 className="font-display text-2xl font-bold text-ink">Review &amp; submit</h1>
              <p className="mt-1 text-sm text-asphalt">Confirm your photos are clear before submitting.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Thumb label="Selfie" src={selfie} />
                <Thumb label={idType} src={idImage} />
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep('id')} className="btn-ghost flex-1">Back</button>
                <button onClick={submit} disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit for review'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}

function CaptureCard({
  title, hint, image, camError, videoRef, onSnap, onRetake, onBack, onNext, nextEnabled, rounded, uploadSlot,
}: {
  title: string; hint: string; image: string | null; camError: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  onSnap: () => void; onRetake: () => void; onBack: () => void; onNext: () => void;
  nextEnabled: boolean; rounded?: boolean; uploadSlot?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-chrome/80 bg-paper-raised p-5 shadow-lot">
      <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-asphalt">{hint}</p>

      <div className={`relative mt-4 aspect-[4/3] overflow-hidden bg-ink ${rounded ? 'rounded-full aspect-square mx-auto w-64' : 'rounded-xl'}`}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="capture" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
      </div>

      {camError && !image && <p className="mt-2 text-xs text-redline">{camError}</p>}

      <div className="mt-4 space-y-2">
        {!image ? (
          <>
            <button onClick={onSnap} className="btn-primary flex w-full items-center justify-center gap-2">
              <HiCamera /> Capture
            </button>
            {uploadSlot}
          </>
        ) : (
          <button onClick={onRetake} className="btn-ghost flex w-full items-center justify-center gap-2">
            <HiRefresh /> Retake
          </button>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={onBack} className="btn-ghost flex-1">Back</button>
          <button onClick={onNext} disabled={!nextEnabled} className="btn-primary flex-1 disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function Thumb({ label, src }: { label: string; src: string | null }) {
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl border border-chrome/70 bg-ink">
        {src && /* eslint-disable-next-line @next/next/no-img-element */ (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        )}
      </div>
      <p className="mt-1 text-center text-xs font-medium text-asphalt">{label}</p>
    </div>
  );
}
