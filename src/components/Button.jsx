// Reusable pill button with an optional trailing arrow.

export default function Button({
  as: Tag = 'a',
  href,
  to,
  variant = 'primary',
  size,
  arrow = false,
  children,
  className = '',
  ...rest
}) {
  let Comp = Tag
  if (to) {
    Comp = 'a'
    href = to
  }

  const classes = ['btn', `btn--${variant}`]
  if (size) classes.push(`btn--${size}`)
  if (className) classes.push(className)

  return (
    <Comp
      href={Tag === 'button' ? undefined : href}
      className={classes.join(' ').trim()}
      {...rest}
    >
      {children}
      {arrow && (
        <span className="btn-arrow" aria-hidden="true">
          →
        </span>
      )}
    </Comp>
  )
}
