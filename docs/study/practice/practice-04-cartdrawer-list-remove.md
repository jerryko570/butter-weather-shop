```ts

const handlePurchase = () => {
    purchase.mutete({
        product.id: product.id,
        product.name: prodduct.name
        quantity, // 사용자 선택
        price_krw: product.price_krw * quantity,
        price_usd: product.price.usd ? product.price_usd * quantity : null, // 없음을 DB에 정직하게 저장하기 위해
    },

    {
        onSuccess: (createPurchase)
    }
    )
}

```
