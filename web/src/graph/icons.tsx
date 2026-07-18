import type { FC, SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" {...props} />
}

function BucketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 7h14l-1.4 12.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7Z" />
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    </Icon>
  )
}

function QueueIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="12" height="8" rx="1.5" />
      <path d="M15 10.5h3.5M15 13.5h2" />
      <path d="M19.5 9.5 22 12l-2.5 2.5" />
    </Icon>
  )
}

function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
      <path d="M19 12c0 1.4-3.1 2.5-7 2.5S5 13.4 5 12" />
    </Icon>
  )
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 19 6v6c0 4.2-3 7.3-7 8.5-4-1.2-7-4.3-7-8.5V6l7-2.5Z" />
      <path d="m9.5 12 1.8 1.8 3.2-3.6" />
    </Icon>
  )
}

function LogsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h9L19 7.5V20a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M14.5 3.5V8H19M8.5 12h7M8.5 15h7M8.5 18h4" />
    </Icon>
  )
}

function BoxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </Icon>
  )
}

const ICONS_BY_PREFIX: Array<[string, FC<SVGProps<SVGSVGElement>>]> = [
  ['aws_s3', BucketIcon],
  ['aws_sqs', QueueIcon],
  ['aws_dynamodb', DatabaseIcon],
  ['aws_iam', ShieldIcon],
  ['aws_cloudwatch', LogsIcon],
]

export function iconForResourceType(resourceType: string) {
  const match = ICONS_BY_PREFIX.find(([prefix]) => resourceType.startsWith(prefix))
  return match ? match[1] : BoxIcon
}
