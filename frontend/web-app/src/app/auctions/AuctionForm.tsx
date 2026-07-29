'use client';

import { createAuction, updateAuction } from '@/app/actions/auctionActions';
import ImageUploader from '@/app/components/ImageUploader';
import { Auction } from '@/types';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type Props = {
  auction?: Auction;
};

type AuctionFormValues = {
  make: string;
  model: string;
  year: number | string;
  color: string;
  milage: number | string;
  reservePrice?: number | string;
  auctionEnd?: string;
  country?: string;
  description?: string;
};

const countries = ['Ghana', 'China', 'Japan', 'USA', 'Canada', 'South Africa'];

export default function AuctionForm({ auction }: Props) {
  const router = useRouter();
  const isEdit = !!auction;
  const [images, setImages] = useState<string[]>([]);
  const [imgError, setImgError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<AuctionFormValues>({
    defaultValues: auction
      ? {
          make: auction.make,
          model: auction.model,
          year: auction.year,
          color: auction.color,
          milage: auction.milage,
        }
      : undefined,
  });

  async function onSubmit(data: AuctionFormValues) {
    try {
      let res;
      if (isEdit && auction) {
        res = await updateAuction(
          {
            make: data.make,
            model: data.model,
            year: +data.year,
            color: data.color,
            milage: +data.milage,
          },
          auction.id
        );
      } else {
        if (images.length === 0) {
          setImgError(true);
          return;
        }
        res = await createAuction({
          ...data,
          year: +data.year,
          milage: +data.milage,
          reservePrice: +(data.reservePrice ?? 0),
          country: data.country || 'Japan',
          auctionEnd: new Date(data.auctionEnd as string).toISOString(),
          images,
          imageUrl: images[0],
        });
      }

      if (res.error) throw res.error;

      const id = isEdit ? auction!.id : res.id;
      router.push(`/auctions/details/${id}`);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      // 401 means the access token was rejected — almost always an expired
      // session whose refresh lapsed. Send the user back through sign-in
      // rather than showing an opaque failure.
      if (status === 401) {
        toast.error('Your session expired — please sign in again.');
        signIn('id-server');
        return;
      }
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      toast.error(message || 'Problem submitting the auction');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-5">
      <div>
        <label className="field-label">Make</label>
        <input {...register('make', { required: true })} className="field-input" />
        {errors.make && <span className="mt-1 block text-xs font-medium text-redline">Make is required</span>}
      </div>
      <div>
        <label className="field-label">Model</label>
        <input {...register('model', { required: true })} className="field-input" />
        {errors.model && <span className="mt-1 block text-xs font-medium text-redline">Model is required</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Year</label>
          <input type="number" {...register('year', { required: true })} className="field-input readout" />
        </div>
        <div>
          <label className="field-label">Colour</label>
          <input {...register('color', { required: true })} className="field-input" />
        </div>
      </div>
      <div>
        <label className="field-label">Mileage</label>
        <input type="number" {...register('milage', { required: true })} className="field-input readout" />
      </div>

      {!isEdit && (
        <>
          <div>
            <label className="field-label">Photos of the car</label>
            <ImageUploader
              value={images}
              onChange={(imgs) => { setImages(imgs); if (imgs.length) setImgError(false); }}
            />
            {imgError && (
              <span className="mt-1 block text-xs font-medium text-redline">
                Add at least one photo of the car.
              </span>
            )}
          </div>
          <div>
            <label className="field-label">Source country</label>
            <select {...register('country', { required: true })} className="field-input" defaultValue="Japan">
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Condition &amp; known faults</label>
            <textarea
              {...register('description', { required: true, minLength: 10, maxLength: 4000 })}
              rows={5}
              placeholder="Describe the car's condition honestly — service history, accident history, mechanical issues, cosmetic wear, and anything a buyer should know before bidding."
              className="field-input resize-y"
            />
            <p className="mt-1 text-xs text-muted">
              Required. Accurate disclosure protects you and the buyer — misleading listings breach
              our{' '}
              <a href="/terms" className="font-medium text-redline hover:text-redline-deep" target="_blank">
                Terms
              </a>
              .
            </p>
            {errors.description && (
              <span className="mt-1 block text-xs font-medium text-redline">
                Please describe the condition (at least 10 characters).
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Reserve price (0 = no reserve)</label>
              <input
                type="number"
                {...register('reservePrice', { required: true })}
                className="field-input readout"
              />
            </div>
            <div>
              <label className="field-label">Auction end date/time</label>
              <input
                type="datetime-local"
                {...register('auctionEnd', { required: true })}
                className="field-input readout"
              />
            </div>
          </div>
        </>
      )}

      <div className="mt-2 flex justify-between">
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Submitting…' : isEdit ? 'Update auction' : 'Create auction'}
        </button>
      </div>
    </form>
  );
}
