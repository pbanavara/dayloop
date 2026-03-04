import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components'

interface TaskWithToken {
  id: string
  title: string
  actionUrl: string
}

interface MorningEmailProps {
  tasks: TaskWithToken[]
  dashboardUrl: string
  date: string
}

export default function MorningEmail({ tasks, dashboardUrl, date }: MorningEmailProps) {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headerStyle}>DayLoop</Text>
          <Text style={subtitleStyle}>{formattedDate}</Text>

          <Text style={introStyle}>
            Here are your {tasks.length} task{tasks.length === 1 ? '' : 's'} for today:
          </Text>

          <Section style={tasksSectionStyle}>
            {tasks.map((task) => (
              <Section key={task.id} style={taskRowStyle}>
                <Text style={taskTitleStyle}>☐ {task.title}</Text>
                <Button href={task.actionUrl} style={doneButtonStyle}>
                  Done ✓
                </Button>
              </Section>
            ))}
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerSectionStyle}>
            <Button href={dashboardUrl} style={dashboardButtonStyle}>
              Open dashboard →
            </Button>
            <Text style={footerTextStyle}>
              DayLoop — your daily planning loop.{' '}
              <Link href={dashboardUrl} style={linkStyle}>
                View all tasks
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const containerStyle = {
  maxWidth: '560px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px',
  border: '1px solid #e5e7eb',
}

const headerStyle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 4px',
}

const subtitleStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 32px',
}

const introStyle = {
  fontSize: '16px',
  color: '#374151',
  margin: '0 0 24px',
}

const tasksSectionStyle = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  padding: '16px',
  marginBottom: '24px',
}

const taskRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #e5e7eb',
}

const taskTitleStyle = {
  fontSize: '15px',
  color: '#111827',
  margin: '0',
  flex: '1',
}

const doneButtonStyle = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600',
  padding: '6px 16px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  marginLeft: '16px',
}

const hrStyle = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footerSectionStyle = {
  textAlign: 'center' as const,
}

const dashboardButtonStyle = {
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: '16px',
}

const footerTextStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
}

const linkStyle = {
  color: '#6b7280',
}
