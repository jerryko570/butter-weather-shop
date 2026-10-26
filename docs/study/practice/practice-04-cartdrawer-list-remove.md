```ts
import { useProduct } from '@/lib/queries/useProducts'
import { usePurchase } from '@/hooks/usePurchase'

const purchase = usePurchase()
const payment = usePayment()

export default function Page() {
    const { data: product, isLoading, error } from useProduct(slug)
    const handlePurchase = () => {
        purchase.mutate({
            product_id: product.id,
            product_name: product.name,
            quantity,
            price_krw: product.price_krw * quantity,
            price_usd: product.price.usd ? price_usd * quantity : null
        }),
        onSuccess: (createdPurchase) => {
            payment.mutate(createdPurchase, {

            })
        }
    }
}
```
