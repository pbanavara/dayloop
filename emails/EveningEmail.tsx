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

interface TaskSummary {
  id: string
  title: string
}

interface IncompleteTask extends TaskSummary {
  carryUrl?: string
  dropUrl?: string
}

interface EveningEmailProps {
  doneTasks: TaskSummary[]
  incompleteTasks: IncompleteTask[]
  planUrl: string
  date: string
}

export default function EveningEmail({
  doneTasks,
  incompleteTasks,
  planUrl,
  date,
}: EveningEmailProps) {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const totalCount = doneTasks.length + incompleteTasks.length

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={headerStyle}>DayLoop</Text>
          <Text style={subtitleStyle}>Evening recap — {formattedDate}</Text>

          {totalCount > 0 && (
            <>
              <Section style={recapSectionStyle}>
                <Text style={recapTitleStyle}>Yesterday</Text>
                <Text style={recapCountStyle}>
                  {doneTasks.length > 0 && (
                    <span style={doneCountStyle}>✓ {doneTasks.length} done</span>
                  )}
                  {doneTasks.length > 0 && incompleteTasks.length > 0 && '  '}
                  {incompleteTasks.length > 0 && (
                    <span style={incompleteCountStyle}>✗ {incompleteTasks.length} incomplete</span>
                  )}
                </Text>
              </Section>

              {incompleteTasks.length > 0 && (
                <Section style={incompleteSectionStyle}>
                  <Text style={sectionTitleStyle}>Not finished — carry forward or drop?</Text>
                  {incompleteTasks.map((task) => (
                    <Section key={task.id} style={incompleteRowStyle}>
                      <Text style={incompleteTaskTitleStyle}>{task.title}</Text>
                      <Section style={buttonGroupStyle}>
                        {task.carryUrl && (
                          <Button href={task.carryUrl} style={carryButtonStyle}>
                            Carry forward
                          </Button>
                        )}
                        {task.dropUrl && (
                          <Button href={task.dropUrl} style={dropButtonStyle}>
                            Drop it
                          </Button>
                        )}
                      </Section>
                    </Section>
                  ))}
                </Section>
              )}

              <Hr style={hrStyle} />
            </>
          )}

          <Section style={planSectionStyle}>
            <Text style={planTitleStyle}>What&apos;s on for tomorrow?</Text>
            <Text style={planSubtitleStyle}>
              Takes 2 minutes. Add your tasks for tomorrow and sleep well.
            </Text>
            <Button href={planUrl} style={planButtonStyle}>
              Open planning page →
            </Button>
          </Section>

          <Hr style={hrStyle} />

          <Text style={footerTextStyle}>
            DayLoop — your daily planning loop.{' '}
            <Link href={planUrl} style={linkStyle}>
              Plan tomorrow
            </Link>
          </Text>
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

const recapSectionStyle = {
  marginBottom: '24px',
}

const recapTitleStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px',
}

const recapCountStyle = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
}

const doneCountStyle = {
  color: '#10b981',
}

const incompleteCountStyle = {
  color: '#ef4444',
}

const incompleteSectionStyle = {
  backgroundColor: '#fff7ed',
  borderRadius: '6px',
  padding: '16px',
  marginBottom: '24px',
  border: '1px solid #fed7aa',
}

const sectionTitleStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 12px',
}

const incompleteRowStyle = {
  borderBottom: '1px solid #fed7aa',
  paddingBottom: '12px',
  marginBottom: '12px',
}

const incompleteTaskTitleStyle = {
  fontSize: '14px',
  color: '#1c1917',
  margin: '0 0 8px',
}

const buttonGroupStyle = {
  display: 'flex',
  gap: '8px',
}

const carryButtonStyle = {
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  padding: '5px 12px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  marginRight: '8px',
}

const dropButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  padding: '5px 12px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
  border: '1px solid #d1d5db',
}

const hrStyle = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const planSectionStyle = {
  textAlign: 'center' as const,
  marginBottom: '8px',
}

const planTitleStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 8px',
}

const planSubtitleStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 20px',
}

const planButtonStyle = {
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footerTextStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
  textAlign: 'center' as const,
}

const linkStyle = {
  color: '#6b7280',
}
