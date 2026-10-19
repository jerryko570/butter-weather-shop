```ts

export const useCartStore() = create<CartStore> (
    persist((set,get) => ({
        items: [],
        isOpen: false,
        addItem: (item) =>
            set((state) => {
                const existing = state.items.find((i) =>
                    i.id === item.id
                )

                if (existing) {
                    return {
                        items: state.items.map((i) =>
                            i.id === item.id ?? {...i, quantity: i.quantity+1} : i
                        )
                    }
                }

                return {
                    items: [...state.items, {...item, quantity: 1} ]
                }
            }),
        removeItem:
        // 아이템 삭제하기
    }))
)
```
