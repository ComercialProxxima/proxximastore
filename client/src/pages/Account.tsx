import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const Account = () => {
  const [activeTab, setActiveTab] = useState("account");
  
  // In a real app, this would come from an API call
  const user = {
    username: "jane_professional",
    email: "jane@example.com",
    displayName: "Jane Pro",
  };

  return (
    <>
      <Tabs defaultValue="account" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-6 border-b border-gray-200 w-full justify-start">
          <TabsTrigger value="transcriptions" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" asChild>
            <Link href="/">Transcriptions</Link>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" asChild>
            <Link href="/privacy-settings">Privacy Settings</Link>
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Account
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-white text-lg">
                {user.displayName.split(' ').map(name => name[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user.displayName}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-base font-medium">Profile Information</h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" defaultValue={user.displayName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue={user.username} />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-base font-medium">Change Password</h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-blue-600">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Account;
