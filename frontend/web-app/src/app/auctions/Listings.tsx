'use client';

import { useEffect, useState } from 'react';
import { getData } from '../actions/auctionActions';
import { useAuctionStore } from '@/hooks/useAuctionStore';
import { useParamsStore } from '@/hooks/useParamsStore';
import { useShallow } from 'zustand/react/shallow';
import { motion, useReducedMotion } from 'motion/react';
import { buildQueryString } from '@/lib/format';
import AuctionCard from './AuctionCard';
import Filters from './Filters';
import AppPagination from '../components/AppPagination';
import EmptyFilter from '../components/EmptyFilter';

export default function Listings() {
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();

  const params = useParamsStore(
    useShallow((state) => ({
      pageNumber: state.pageNumber,
      pageSize: state.pageSize,
      searchTerm: state.searchTerm,
      orderBy: state.orderBy,
      filterBy: state.filterBy,
      seller: state.seller,
      winner: state.winner,
      country: state.country,
    }))
  );
  const setParams = useParamsStore((state) => state.setParams);

  const { auctions, totalCount, pageCount, setData } = useAuctionStore(
    useShallow((state) => ({
      auctions: state.auctions,
      totalCount: state.totalCount,
      pageCount: state.pageCount,
      setData: state.setData,
    }))
  );

  function setPageNumber(pageNumber: number) {
    setParams({ pageNumber });
  }

  useEffect(() => {
    setLoading(true);
    const query = buildQueryString(params);
    getData(query)
      .then((data) => {
        setData(data);
      })
      .finally(() => setLoading(false));
  }, [params, setData]);

  if (loading && auctions.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: params.pageSize }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-chrome/60 bg-paper-raised">
            <div className="aspect-[16/10] w-full bg-chrome/40" />
            <div className="p-4">
              <div className="h-4 w-2/3 rounded bg-chrome/50" />
              <div className="mt-3 h-3 w-1/3 rounded bg-chrome/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Filters />
      {auctions.length === 0 ? (
        <EmptyFilter showReset />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="readout text-sm text-asphalt">
              {totalCount} {totalCount === 1 ? 'lot' : 'lots'}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {auctions.map((auction, i) => (
              <motion.div
                key={auction.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <AuctionCard auction={auction} />
              </motion.div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <AppPagination
              currentPage={params.pageNumber}
              pageCount={pageCount}
              pageChanged={setPageNumber}
            />
          </div>
        </>
      )}
    </>
  );
}
