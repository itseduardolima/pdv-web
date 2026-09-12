import { useRouter } from 'next/navigation'
import { useLogout } from '@/hooks/queries/use-logout'
import { useSession } from '@/hooks/use-session'

export function useHomePage() {
  const router = useRouter()
  const session = useSession()
  const logout = useLogout()

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push('/login')
        router.refresh()
      },
    })
  }

  return { operator: session.operator, isLoggingOut: logout.isPending, handleLogout }
}
