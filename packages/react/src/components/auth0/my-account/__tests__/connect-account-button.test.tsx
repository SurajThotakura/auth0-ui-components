import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';

import { ConnectAccountButtonView } from '@/components/auth0/my-account/connect-account-button';
import { renderWithProviders } from '@/tests/utils/test-provider';

const createProps = (
  overrides: Partial<React.ComponentProps<typeof ConnectAccountButtonView>> = {},
): React.ComponentProps<typeof ConnectAccountButtonView> => ({
  title: 'Google Calendar',
  description: 'Read and write calendar events · popup mode',
  icon: <img alt="Google" src="google.svg" />,
  connectLabel: 'Connect Google',
  connectingLabel: 'Connecting...',
  disabled: false,
  isConnecting: false,
  error: null,
  styling: { variables: { common: {}, light: {}, dark: {} }, classes: {} },
  customMessages: {},
  onConnect: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('ConnectAccountButtonView', () => {
  it('renders the responsive provider row and action', () => {
    renderWithProviders(<ConnectAccountButtonView {...createProps()} />);

    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Read and write calendar events · popup mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Google' })).toBeEnabled();
    expect(screen.getByAltText('Google')).toBeInTheDocument();
  });

  it('shows a disabled, busy connecting action', () => {
    renderWithProviders(<ConnectAccountButtonView {...createProps({ isConnecting: true })} />);

    const button = screen.getByRole('button', { name: /connecting/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('starts a connection when the action is clicked', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<ConnectAccountButtonView {...createProps({ onConnect })} />);

    await user.click(screen.getByRole('button', { name: 'Connect Google' }));

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('announces errors', () => {
    renderWithProviders(
      <ConnectAccountButtonView {...createProps({ error: new Error('Connection expired') })} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Connection expired');
  });

  it('applies action styling overrides', () => {
    renderWithProviders(
      <ConnectAccountButtonView
        {...createProps({
          styling: {
            variables: { common: {}, light: {}, dark: {} },
            classes: { 'ConnectAccountButton-action': 'custom-action' },
          },
        })}
      />,
    );

    expect(screen.getByRole('button', { name: 'Connect Google' })).toHaveClass('custom-action');
  });
});
