'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
  uploadProductImage,
  type ProductInput,
} from '@/lib/queries/useAdminProducts'
import Text from '@/components/ui/Text/Text'

// 등록 모드(productId 없음) / 수정 모드(productId 있음) 둘 다 처리
export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter()
  const isEdit = !!productId

  // 수정 모드면 기존 값 로드
  const { data: existing, isLoading: loadingExisting } =
    useAdminProduct(productId)

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  if (isEdit && loadingExisting) {
    return (
      <Text
        as="p"
        className="py-16 text-center text-[13px] text-[var(--color-ink-muted)]"
      >
        불러오는 중…
      </Text>
    )
  }

  return (
    <FormBody
      key={existing?.id ?? 'new'}
      initial={existing}
      onSubmit={async (input) => {
        if (isEdit && productId) {
          await updateProduct.mutateAsync({ id: productId, input })
        } else {
          await createProduct.mutateAsync(input)
        }
        router.push('/admin/products')
        router.refresh()
      }}
      submitting={createProduct.isPending || updateProduct.isPending}
      isEdit={isEdit}
    />
  )
}

// ── 실제 폼 본문 (initial 값으로 초기 상태를 잡으려고 분리) ──
function FormBody({
  initial,
  onSubmit,
  submitting,
  isEdit,
}: {
  initial?: ProductInput
  onSubmit: (input: ProductInput) => Promise<void>
  submitting: boolean
  isEdit: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [descriptionEn, setDescriptionEn] = useState(
    initial?.description_en ?? ''
  )
  const [priceKrw, setPriceKrw] = useState(
    initial?.price_krw != null ? String(initial.price_krw) : ''
  )
  const [priceUsd, setPriceUsd] = useState(
    initial?.price_usd != null ? String(initial.price_usd) : ''
  )
  const [stock, setStock] = useState(
    initial?.stock != null ? String(initial.stock) : '0'
  )
  const [category, setCategory] = useState(initial?.category ?? '')
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [status, setStatus] = useState<string>(initial?.status ?? 'active')
  const [isActive, setIsActive] = useState(initial?.is_active ?? false)
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [detailImages, setDetailImages] = useState<string[]>(
    initial?.detail_images ?? []
  )

  const [uploading, setUploading] = useState(false)
  const [uploadingDetail, setUploadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 갤러리·상세 이미지가 같은 업로드 로직을 써서 헬퍼로 묶음.
  // setter(어디에 담을지)와 setBusy(어느 로딩 표시)를 인자로 받는다.
  const uploadInto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    setBusy: (b: boolean) => void
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        urls.push(await uploadProductImage(file))
      }
      setter((prev) => [...prev, ...urls])
    } catch {
      setError('이미지 업로드에 실패했어요. Storage 정책을 확인해주세요.')
    } finally {
      setBusy(false)
      e.target.value = '' // 같은 파일 다시 선택 가능하게 초기화
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
    uploadInto(e, setImages, setUploading)
  const handleUploadDetail = (e: React.ChangeEvent<HTMLInputElement>) =>
    uploadInto(e, setDetailImages, setUploadingDetail)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !slug.trim() || !priceKrw.trim()) {
      setError('이름·slug·원화 가격은 필수예요.')
      return
    }

    const input: ProductInput = {
      name: name.trim(),
      name_en: nameEn.trim() || null,
      slug: slug.trim(),
      description: description.trim() || null,
      description_en: descriptionEn.trim() || null,
      price_krw: Number(priceKrw),
      price_usd: priceUsd.trim() ? Number(priceUsd) : null,
      stock: Number(stock) || 0,
      category: category || null,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      options: [], // TODO: 옵션 입력 UI 추가 시 연결. 지금은 빈 배열
      status: status as ProductInput['status'],
      is_active: isActive,
      images,
      detail_images: detailImages,
    }

    try {
      await onSubmit(input)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg.includes('duplicate')
          ? '이미 쓰는 slug예요. 다른 값으로 바꿔주세요.'
          : '저장에 실패했어요. 입력값을 확인해주세요.'
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Text
          as="h1"
          className="text-[20px] font-semibold text-[var(--color-ink)]"
        >
          {isEdit ? '상품 수정' : '새 상품 등록'}
        </Text>
      </div>

      <div className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        {/* 이미지 */}
        <Field label="이미지">
          <div className="flex flex-wrap gap-2">
            {images.map((url) => (
              <div
                key={url}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-[#eee]"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((u) => u !== url))
                  }
                  className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#ccc] text-[11px] text-[var(--color-ink-muted)] hover:border-[var(--color-ink)]">
              {uploading ? '…' : '+ 추가'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        </Field>

        {/* 상세 이미지 — 상세페이지에 세로로 길게 쌓인다 */}
        <Field label="상세 이미지 (상세페이지에 위→아래 순서로 길게 표시)">
          <div className="space-y-2">
            {detailImages.map((url, i) => (
              <div
                key={url}
                className="relative overflow-hidden rounded-lg border border-[#eee]"
              >
                <Image
                  src={url}
                  alt=""
                  width={600}
                  height={400}
                  className="h-auto w-full object-contain"
                />
                <Text
                  as="span"
                  className="absolute top-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white"
                >
                  {i + 1}
                </Text>
                <button
                  type="button"
                  onClick={() =>
                    setDetailImages((prev) => prev.filter((u) => u !== url))
                  }
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-12 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#ccc] text-[12px] text-[var(--color-ink-muted)] hover:border-[var(--color-ink)]">
              {uploadingDetail ? '업로드 중…' : '+ 상세 이미지 추가'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadDetail}
                className="hidden"
              />
            </label>
          </div>
        </Field>

        {/* 이름 */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="이름 (국문) *">
            <TextInput
              value={name}
              onChange={setName}
              placeholder="버터 드롭 키링"
            />
          </Field>
          <Field label="이름 (영문)">
            <TextInput
              value={nameEn}
              onChange={setNameEn}
              placeholder="Butter Drop Keyring"
            />
          </Field>
        </div>

        {/* slug */}
        <Field label="slug * (URL 주소, 영문·하이픈)">
          <TextInput
            value={slug}
            onChange={setSlug}
            placeholder="butter-drop-keyring-lemon"
          />
        </Field>

        {/* 설명 */}
        <Field label="설명 (국문)">
          <TextArea value={description} onChange={setDescription} />
        </Field>
        <Field label="설명 (영문)">
          <TextArea value={descriptionEn} onChange={setDescriptionEn} />
        </Field>

        {/* 가격·재고 */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="가격 (원) *">
            <TextInput
              value={priceKrw}
              onChange={setPriceKrw}
              type="number"
              placeholder="15000"
            />
          </Field>
          <Field label="가격 (USD)">
            <TextInput
              value={priceUsd}
              onChange={setPriceUsd}
              type="number"
              placeholder="12"
            />
          </Field>
          <Field label="재고">
            <TextInput value={stock} onChange={setStock} type="number" />
          </Field>
        </div>

        {/* 카테고리·태그 */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="카테고리">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--color-ink)]"
            >
              <option value="">선택 안 함</option>
              <option value="keyring">키링 (keyring)</option>
              <option value="bead">비즈 (bead)</option>
              <option value="etc">기타 (etc)</option>
            </select>
          </Field>
          <Field label="태그 (쉼표로 구분)">
            <TextInput
              value={tags}
              onChange={setTags}
              placeholder="여름, 파스텔"
            />
          </Field>
        </div>

        {/* 상태 토글 */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="판매 상태">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--color-ink)]"
            >
              <option value="active">판매중</option>
              <option value="sold_out">품절</option>
            </select>
          </Field>
          <Field label="공개 여부">
            <label className="flex h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[#e5e5e5] px-3 text-[14px]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              {isActive ? '사이트에 공개' : '비공개 (초안)'}
            </label>
          </Field>
        </div>
      </div>

      {error && (
        <Text as="p" className="text-[13px] text-red-500" role="alert">
          {error}
        </Text>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploading || uploadingDetail}
          className="rounded-lg bg-[var(--color-ink)] px-6 py-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? '저장 중…' : isEdit ? '수정 저장' : '등록'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          취소
        </button>
      </div>
    </form>
  )
}

// ── 작은 UI 헬퍼들 ──
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <Text
        as="span"
        className="text-[12px] font-medium text-[var(--color-ink-muted)]"
      >
        {label}
      </Text>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--color-ink)]"
    />
  )
}

function TextArea({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full resize-y rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--color-ink)]"
    />
  )
}
