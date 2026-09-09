"use client";

import Link from "next/link";
import {
  banUserAction,
  deletePostAsAdmin,
  hidePostAsAdmin,
  hideReplyAsAdmin,
  resolveReportAction,
  restorePostAsAdmin,
  restoreReplyAsAdmin,
  unbanUserAction,
} from "@/lib/actions/admin";
import { formatTimeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Stats = {
  users: number;
  logins: number;
  posts: number;
  replies: number;
  openReports: number;
};

type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  lastLoginAt: Date | null;
  bannedAt: Date | null;
  createdAt: Date;
};

type AdminReport = {
  id: string;
  targetType: "post" | "reply";
  targetId: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved";
  createdAt: Date;
  reporterUsername: string;
  reporterEmail: string;
  postId: string;
};

type AdminPost = {
  id: string;
  title: string;
  body: string;
  isAnonymous: boolean;
  createdAt: Date;
  hiddenAt: Date | null;
  hiddenBy: string | null;
  authorUsername: string;
  authorEmail: string;
};

type AdminReply = {
  id: string;
  postId: string;
  body: string;
  isAnonymous: boolean;
  createdAt: Date;
  hiddenAt: Date | null;
  hiddenBy: string | null;
  authorUsername: string;
  authorEmail: string;
};

export function AdminDashboard({
  stats,
  users,
  reports,
  posts,
  replies,
}: {
  stats: Stats;
  users: AdminUser[];
  reports: AdminReport[];
  posts: AdminPost[];
  replies: AdminReply[];
}) {
  return (
    <div className="flex flex-col gap-6 overflow-x-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Users, logins, reports, and the real author behind anonymous posts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Users" value={stats.users} />
        <StatCard label="Logins" value={stats.logins} />
        <StatCard label="Posts" value={stats.posts} />
        <StatCard label="Replies" value={stats.replies} />
        <StatCard label="Open reports" value={stats.openReports} />
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No reports yet.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{formatTimeAgo(report.createdAt)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{report.reporterUsername}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.reporterEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        className="underline-offset-2 hover:underline"
                        href={`/posts/${report.postId}`}
                      >
                        {report.targetType}
                      </Link>
                      {report.details ? (
                        <div className="max-w-xs text-xs text-muted-foreground">
                          {report.details}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>
                      <Badge variant={report.status === "open" ? "default" : "secondary"}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.status === "open" ? (
                        <form action={resolveReportAction.bind(null, report.id)}>
                          <Button type="submit" size="sm" variant="outline">
                            Resolve
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="font-medium">
                      {person.username}{" "}
                      {person.role === "admin" ? (
                        <Badge variant="secondary">admin</Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">{person.email}</div>
                  </TableCell>
                  <TableCell>
                    {person.lastLoginAt ? formatTimeAgo(person.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell>{formatTimeAgo(person.createdAt)}</TableCell>
                  <TableCell>
                    {person.bannedAt ? (
                      <Badge variant="destructive">banned</Badge>
                    ) : (
                      <Badge variant="secondary">active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {person.role === "admin" ? null : person.bannedAt ? (
                      <form action={unbanUserAction.bind(null, person.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          Unban
                        </Button>
                      </form>
                    ) : (
                      <form action={banUserAction.bind(null, person.id)}>
                        <Button type="submit" size="sm" variant="destructive">
                          Ban
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>True author</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link href={`/posts/${post.id}`} className="font-medium hover:underline">
                      {post.title}
                    </Link>
                    <div className="max-w-sm truncate text-xs text-muted-foreground">
                      {post.body}
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.authorUsername}
                    {post.isAnonymous ? " (anon)" : ""}
                    <div className="text-xs text-muted-foreground">{post.authorEmail}</div>
                  </TableCell>
                  <TableCell>
                    {post.hiddenAt ? `Hidden (${post.hiddenBy})` : "Public"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {post.hiddenAt ? (
                        <form action={restorePostAsAdmin.bind(null, post.id)}>
                          <Button type="submit" size="sm" variant="outline">
                            Restore
                          </Button>
                        </form>
                      ) : (
                        <form action={hidePostAsAdmin.bind(null, post.id)}>
                          <Button type="submit" size="sm" variant="destructive">
                            Hide
                          </Button>
                        </form>
                      )}
                      <form action={deletePostAsAdmin.bind(null, post.id)}>
                        <Button type="submit" size="sm" variant="ghost">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="replies" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reply</TableHead>
                <TableHead>True author</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {replies.map((reply) => (
                <TableRow key={reply.id}>
                  <TableCell>
                    <Link href={`/posts/${reply.postId}`} className="max-w-sm truncate hover:underline">
                      {reply.body}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {reply.authorUsername}
                    {reply.isAnonymous ? " (anon)" : ""}
                    <div className="text-xs text-muted-foreground">{reply.authorEmail}</div>
                  </TableCell>
                  <TableCell>
                    {reply.hiddenAt ? `Hidden (${reply.hiddenBy})` : "Public"}
                  </TableCell>
                  <TableCell>
                    {reply.hiddenAt ? (
                      <form action={restoreReplyAsAdmin.bind(null, reply.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          Restore
                        </Button>
                      </form>
                    ) : (
                      <form action={hideReplyAsAdmin.bind(null, reply.id)}>
                        <Button type="submit" size="sm" variant="destructive">
                          Hide
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent className="px-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-extrabold">{value}</div>
      </CardContent>
    </Card>
  );
}
