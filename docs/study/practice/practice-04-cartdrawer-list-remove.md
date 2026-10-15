```ts


persist(
  (set,get) => ({
    items: [],
    isOpen: false,
    addItem: (item) =>
      set((state) => {
        const existing = state.items.fine((i) =>
          i.id === item.id)

        if (existing) {
          items: state.items.map((i)=>
            i.id === item.id ?? {...i, quantity: i.quantity + 1} : i
          )
        }

        return {
          items: [...state.items, {...item, quantity: 1}]
        }
      }
      )
  })
)
```
