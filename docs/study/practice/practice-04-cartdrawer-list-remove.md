```ts
1.
removeItem : (id) =>
    set((state) => ({
        items: state.items.filter((i) =>
            i.id !== id
        )
    }))


2. id

3. const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('slug', slug)
  .single()


4. export default function Page() {
    const { data: product } = useProduct(slug)
}

5. return {
    totalKrw: store.totalKrw(),
    totalUsd: store.totalUsd(),
}

6. updateQuantity: (id, quantity) =>
    set((state) => ({
        items: id === 0 ?
    })) --> 이거는 id 아니야

```
