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

function NetworkIcon(props: SVGProps<SVGSVGElement>) {
  // VPC: an outer boundary with a small internal mesh, like a private network diagram.
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
      <path d="M8 9v0M8 9 12 15M16 9 12 15" />
    </Icon>
  )
}

function SubnetIcon(props: SVGProps<SVGSVGElement>) {
  // A smaller partitioned box inside a boundary, distinguishing it from the VPC itself.
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" strokeDasharray="2 2" />
      <rect x="7" y="8" width="10" height="8" rx="1" />
    </Icon>
  )
}

function GatewayIcon(props: SVGProps<SVGSVGElement>) {
  // Internet gateway: an arrow passing through a doorway/portal.
  return (
    <Icon {...props}>
      <path d="M8 3.5v17M16 3.5v17" />
      <path d="M2 12h13M11 8.5 15 12l-4 3.5" />
    </Icon>
  )
}

function NatIcon(props: SVGProps<SVGSVGElement>) {
  // NAT gateway: two arrows converging/translating through a single point.
  return (
    <Icon {...props}>
      <path d="M4 8h6l3 4-3 4H4" />
      <path d="M20 8h-4M20 16h-4" />
      <circle cx="13" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  )
}

function RouteTableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4" width="17" height="16" rx="1.5" />
      <path d="M3.5 9.5h17M9 9.5V20" />
    </Icon>
  )
}

function EipIcon(props: SVGProps<SVGSVGElement>) {
  // Elastic IP: a location pin.
  return (
    <Icon {...props}>
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </Icon>
  )
}

function FirewallIcon(props: SVGProps<SVGSVGElement>) {
  // Security group: a brick-wall pattern, distinct from IAM's shield.
  return (
    <Icon {...props}>
      <path d="M3.5 6h7v4h-7zM10.5 6h7v4h-7zM3.5 10h4v4h-4zM7.5 10h7v4h-7zM14.5 10h4v4h-4zM3.5 14h7v4h-7zM10.5 14h7v4h-7z" />
    </Icon>
  )
}

function LoadBalancerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="4.5" cy="12" r="1.6" />
      <path d="M6 12h3M9 8v8" />
      <path d="M9 8h6M9 16h6" />
      <circle cx="18" cy="8" r="1.6" />
      <circle cx="18" cy="16" r="1.6" />
    </Icon>
  )
}

function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  )
}

function ContainerIcon(props: SVGProps<SVGSVGElement>) {
  // ECS: stacked container units.
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </Icon>
  )
}

function FolderIcon(props: SVGProps<SVGSVGElement>) {
  // EFS: shared filesystem, distinct from S3's bucket.
  return (
    <Icon {...props}>
      <path d="M3.5 6.5a1 1 0 0 1 1-1h4.6l1.6 2h9.3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1h-15.5a1 1 0 0 1-1-1Z" />
    </Icon>
  )
}

function CdnIcon(props: SVGProps<SVGSVGElement>) {
  // CloudFront: a globe with distribution rings.
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.4 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.4-3.6-8.5S9.6 5.8 12 3.5Z" />
    </Icon>
  )
}

function CompassIcon(props: SVGProps<SVGSVGElement>) {
  // Route53: DNS routing.
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-2 6-6 2 2-6Z" />
    </Icon>
  )
}

function CertificateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m9 8.5 2 2 3.5-3.5" />
      <path d="m9 13.5-1.5 7 4.5-2.5 4.5 2.5-1.5-7" />
    </Icon>
  )
}

interface ResourceTypeInfo {
  prefix: string
  icon: FC<SVGProps<SVGSVGElement>>
  label: string
}

const RESOURCE_TYPES: ResourceTypeInfo[] = [
  { prefix: 'aws_vpc', icon: NetworkIcon, label: 'VPC' },
  { prefix: 'aws_subnet', icon: SubnetIcon, label: 'Subnet' },
  { prefix: 'aws_internet_gateway', icon: GatewayIcon, label: 'Internet Gateway' },
  { prefix: 'aws_nat_gateway', icon: NatIcon, label: 'NAT Gateway' },
  { prefix: 'aws_route_table', icon: RouteTableIcon, label: 'Route Table' },
  { prefix: 'aws_eip', icon: EipIcon, label: 'Elastic IP' },
  { prefix: 'aws_security_group', icon: FirewallIcon, label: 'Security Group' },
  { prefix: 'aws_iam_role_policy_attachment', icon: ShieldIcon, label: 'IAM Policy Attachment' },
  { prefix: 'aws_iam_role_policy', icon: ShieldIcon, label: 'IAM Policy' },
  { prefix: 'aws_iam', icon: ShieldIcon, label: 'IAM Role' },
  { prefix: 'aws_acm_certificate', icon: CertificateIcon, label: 'ACM Certificate' },
  { prefix: 'aws_lb_target_group', icon: TargetIcon, label: 'Target Group' },
  { prefix: 'aws_lb', icon: LoadBalancerIcon, label: 'Load Balancer' },
  { prefix: 'aws_elb', icon: LoadBalancerIcon, label: 'Load Balancer' },
  { prefix: 'aws_ecs_cluster', icon: ContainerIcon, label: 'ECS Cluster' },
  { prefix: 'aws_ecs_service', icon: ContainerIcon, label: 'ECS Service' },
  { prefix: 'aws_ecs_task_definition', icon: ContainerIcon, label: 'ECS Task Definition' },
  { prefix: 'aws_ecs', icon: ContainerIcon, label: 'ECS' },
  { prefix: 'aws_rds_cluster_instance', icon: DatabaseIcon, label: 'Aurora Instance' },
  { prefix: 'aws_rds_cluster', icon: DatabaseIcon, label: 'Aurora Cluster' },
  { prefix: 'aws_rds', icon: DatabaseIcon, label: 'Database' },
  { prefix: 'aws_db_subnet_group', icon: DatabaseIcon, label: 'DB Subnet Group' },
  { prefix: 'aws_dynamodb', icon: DatabaseIcon, label: 'DynamoDB Table' },
  { prefix: 'aws_efs', icon: FolderIcon, label: 'EFS' },
  { prefix: 'aws_s3', icon: BucketIcon, label: 'S3 Bucket' },
  { prefix: 'aws_sqs', icon: QueueIcon, label: 'SQS Queue' },
  { prefix: 'aws_cloudfront', icon: CdnIcon, label: 'CloudFront' },
  { prefix: 'aws_route53', icon: CompassIcon, label: 'Route53' },
  { prefix: 'aws_cloudwatch', icon: LogsIcon, label: 'CloudWatch Logs' },
]

function prettifyResourceType(resourceType: string): string {
  return resourceType
    .replace(/^aws_/, '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function lookup(resourceType: string): ResourceTypeInfo | undefined {
  // Longest-prefix match first so e.g. "aws_lb_target_group" beats "aws_lb".
  return [...RESOURCE_TYPES].sort((a, b) => b.prefix.length - a.prefix.length).find((t) => resourceType.startsWith(t.prefix))
}

export function iconForResourceType(resourceType: string): FC<SVGProps<SVGSVGElement>> {
  return lookup(resourceType)?.icon ?? BoxIcon
}

export function labelForResourceType(resourceType: string): string {
  return lookup(resourceType)?.label ?? prettifyResourceType(resourceType)
}
