import { usePathname, useRouter } from 'next/navigation'
import { useLogout } from '@/hooks/queries/use-logout'
import { useSession } from '@/hooks/use-session'
import { useTenant } from '@/hooks/use-tenant'
import { isNavItemActive, navItemsForRole, ROLE_LABEL } from '@/lib/navigation'

export function useAppShell() {
  const tenant = useTenant()
  const { operator } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const logout = useLogout()

  const items = navItemsForRole(operator.role).map((item) => ({ ...item, active: isNavItemActive(item, pathname) }))

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push('/login')
        router.refresh()
      },
    })
  }

  return { tenant, operator, roleLabel: ROLE_LABEL[operator.role], items, isLoggingOut: logout.isPending, handleLogout }
}
