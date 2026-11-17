export default function Card({
  title,
  description,
  actions,
  as: Tag = "section",
  titleAs: TitleTag = "h2",
  padded = true,
  className = "",
  children,
  ...rest
}) {
  const hasHeader = title || description || actions;

  return (
    <Tag
      className={[
        "rounded-xl border border-gray-200 bg-white shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <TitleTag className="text-base font-semibold">{title}</TitleTag>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex max-w-full flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </Tag>
  );
}
