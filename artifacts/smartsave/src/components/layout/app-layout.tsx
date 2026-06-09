import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { LayoutDashboard, Receipt, PieChart, Target, Trophy, TrendingUp } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/" },
    { title: "Expenses", icon: Receipt, path: "/expenses" },
    { title: "Budget", icon: PieChart, path: "/budget" },
    { title: "Goals", icon: Target, path: "/goals" },
    { title: "Challenges", icon: Trophy, path: "/challenges" },
    { title: "Insights", icon: TrendingUp, path: "/insights" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="py-6 px-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">SmartSave</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.path}
                        className="py-6 text-base rounded-xl transition-all"
                      >
                        <Link href={item.path} className="flex items-center gap-3">
                          <item.icon size={20} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="bg-secondary/10 text-secondary-foreground p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Level 5</p>
                <p className="font-bold text-sm">Savvy Saver</p>
              </div>
              <Trophy size={20} className="text-secondary" />
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 flex items-center px-6 border-b bg-background shrink-0">
            <SidebarTrigger className="md:hidden mr-4" />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                US
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
