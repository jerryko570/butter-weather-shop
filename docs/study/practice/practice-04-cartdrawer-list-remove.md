```ts

export const useCartStore() = create<CartStore> () (
    persist((get,set) => ({
        items: [],
        isOpen: false,
        getItem: (id) =>
            get().items.find((i) =>
                 i.id === id
            ),
        removeCategory: (category) =>
            set((state) => ({
                items: state.items.filter((i) =>
                    i.category !== category
                )
            })),

        setAllQuantity: (quantity) =>
            set((state) => ({
                items: state.items.map((i) =>
                  {...i, quantity}
                )
            }) )
    }))
)
```
