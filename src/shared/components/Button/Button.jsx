// Reusable pill button with an optional trailing arrow.

export default function Button({
  as: Tag = 'a',
  href,
  to,
  variant = 'primary',
  size,
  arrow = false,
  type,
  children,
  className = '',
  ...rest
}) {
  let Comp = Tag
  if (to) {
    Comp = 'a'
    href = to
  }

  // When used as a plain <button>, default type to "submit" so it works
  // correctly inside forms without the caller having to remember.
  let resolvedType = type
  if (Tag === 'button' && resolvedType === undefined) {
    resolvedType = 'submit'
  }

  const classes = ['btn', `btn--${variant}`]
  if (size) classes.push(`btn--${size}`)
  if (className) classes.push(className)

  const props = { className: classes.join(' ').trim(), ...rest }
  if (Comp === 'a') {
    props.href = href
  } else {
    props.type = resolvedType
  }

  return (
    <Comp {...props}>
      {children}
      {arrow && (
        <span className="btn-arrow" aria-hidden="true">
          →
        </span>
      )}
    </Comp>
  )
}