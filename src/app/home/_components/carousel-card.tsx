'use client'

import { useRef, Children, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CarouselCardProps {
  title: string
  viewAllHref: string
  icon: React.ReactNode
  children: React.ReactNode
  gap?: number
  className?: string
}

const CLONE_COUNT = 2

export function CarouselCard({
  title,
  viewAllHref,
  icon,
  children,
  gap = 16,
  className,
}: CarouselCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slides = Children.toArray(children)
  const [activeIndex, setActiveIndex] = useState(0)
  const isJumpingRef = useRef(false)

  const totalSlides = slides.length
  const infiniteSlides =
    totalSlides > 1
      ? [...slides.slice(-CLONE_COUNT), ...slides, ...slides.slice(0, CLONE_COUNT)]
      : slides
  const offset = totalSlides > 1 ? CLONE_COUNT : 0

  const getCardSize = useCallback(() => {
    const el = scrollRef.current
    if (!el) return 280
    const card = el.querySelector('[data-carousel-card]')
    return card?.getBoundingClientRect().width ?? 280
  }, [])

  const scroll = (dir: number) => {
    const el = scrollRef.current
    if (!el || totalSlides === 0) return
    const cardSize = getCardSize() + gap
    el.scrollBy({ left: dir * cardSize, behavior: 'smooth' })
  }

  const goTo = (index: number) => {
    const el = scrollRef.current
    if (!el || totalSlides === 0) return
    const cardSize = getCardSize() + gap
    const targetScroll = (offset + index) * cardSize
    el.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el || totalSlides === 0) return

    const init = () => {
      const cardSize = getCardSize() + gap
      el.scrollLeft = offset * cardSize
    }

    init()
    const ro = new ResizeObserver(init)
    ro.observe(el)
    return () => ro.disconnect()
  }, [totalSlides, offset, gap])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || totalSlides === 0) return

    const cardSize = getCardSize() + gap
    const realStart = offset * cardSize
    const realEnd = (offset + totalSlides - 1) * cardSize

    const handleScroll = () => {
      if (isJumpingRef.current) return

      const scrollLeft = el.scrollLeft

      if (scrollLeft < realStart - 20) {
        isJumpingRef.current = true
        const jumpTo = (offset + totalSlides - CLONE_COUNT) * cardSize
        el.scrollTo({ left: jumpTo, behavior: 'auto' })
        setActiveIndex(totalSlides - 1)
        requestAnimationFrame(() => {
          isJumpingRef.current = false
        })
        return
      }

      if (scrollLeft > realEnd + 20) {
        isJumpingRef.current = true
        el.scrollTo({ left: realStart, behavior: 'auto' })
        setActiveIndex(0)
        requestAnimationFrame(() => {
          isJumpingRef.current = false
        })
        return
      }

      const rawIndex = (scrollLeft - realStart) / cardSize
      const index = Math.min(
        totalSlides - 1,
        Math.max(0, Math.round(rawIndex))
      )
      setActiveIndex(index)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [totalSlides, offset, gap])

  const dotsCount = totalSlides

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm', className)}>
      <div className="p-3 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 shrink-0">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-1 ml-auto">
          <Link href={viewAllHref} className="text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0">
            View all
          </Link>
          <span className="text-slate-200 mx-1">|</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide py-1 -mx-1"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {infiniteSlides.map((child, i) => (
            <div
              key={i}
              data-carousel-card
              className="shrink-0 w-[85%] min-w-[220px] sm:w-[calc(50%-8px)]"
              style={{ scrollSnapAlign: 'start' }}
            >
              {child}
            </div>
          ))}
        </div>

        {dotsCount > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: dotsCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === activeIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
