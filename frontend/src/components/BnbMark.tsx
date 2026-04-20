export function BnbMark({
  className = "h-4 w-4",
  color = "#F3BA2F",
}: {
  className?: string
  color?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <path
        fill={color}
        d="M7.128 10.488 12 5.616l4.874 4.872 2.834-2.834L12 0 4.294 7.654l2.834 2.834Zm-2.834 2.833L1.46 16.155l2.834 2.834 2.834-2.834-2.834-2.834Zm2.834 2.834L12 21.028l4.874-4.873 2.834 2.834L12 24l-7.706-7.705 2.834-2.834Zm9.746 0 2.834 2.834 2.834-2.834-2.834-2.834-2.834 2.834ZM14.876 12 12 9.124 9.128 11.996l-.004.004L12 14.876 14.876 12Z"
      />
    </svg>
  )
}
