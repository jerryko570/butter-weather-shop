import { redirect } from 'next/navigation'

// /admin 으로 들어오면 상품 관리로 보낸다.
export default function AdminIndexPage() {
  redirect('/admin/products')
}
