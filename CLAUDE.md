# Project conventions

## Angular templates

Bind conditional classes with the ternary form of `ngClass`:

```html
[ngClass]="condition ? 'class-when-true' : 'class-when-false'"
```

Use `''` for the branch that adds nothing:

```html
[ngClass]="is_active ? 'bg-green text-white' : ''"
```

Do not use the object or array forms, and do not use `[class.x]` bindings:

```html
<!-- avoid -->
[ngClass]="{ 'bg-green': is_active, 'bg-white': !is_active }"
[ngClass]="['bg-green', is_active ? 'font-bold' : '']"
[class.bg-green]="is_active"
```
