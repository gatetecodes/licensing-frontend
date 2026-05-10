import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Modal,
  Dropdown,
  Popover,
  Badge,
} from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined, FilterOutlined } from "@ant-design/icons";
import { Icon } from "@iconify/react";
import { useState } from "react";

import { StatusIndicator } from "@/components/status-indicator";
import { Table } from "@/components/table";
import { getAxiosApiErrorMessage } from "@/lib/api-error";
import { feedback } from "@/lib/feedback/feedback-bridge";
import {
  useAdminUsers,
  useInviteInternalUserMutation,
  useUpdateInternalUserStatusMutation,
} from "../hooks/use-admin";
import type {
  AdminUser,
  InternalRole,
  ManagedUserStatus,
} from "../types/admin.types";

const { Title, Paragraph, Text } = Typography;

const UserManagementPage = () => {
  const usersQuery = useAdminUsers();
  const updateStatusMutation = useUpdateInternalUserStatusMutation();
  const inviteMutation = useInviteInternalUserMutation();
  const [form] = Form.useForm<{
    name: string;
    email: string;
    role: "REVIEWER" | "APPROVER" | "ADMIN";
  }>();
  const [statusFilter, setStatusFilter] = useState<
    ManagedUserStatus | undefined
  >();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const filteredUsers = (usersQuery.data?.items ?? []).filter((user) => {
    const matchesStatus = statusFilter ? user.status === statusFilter : true;
    const matchesRole = roleFilter
      ? user.roles.includes(roleFilter as InternalRole)
      : true;
    return matchesStatus && matchesRole;
  });

  const activeFilterCount = [statusFilter, roleFilter].filter(Boolean).length;

  const handleInvite = async (values: {
    name: string;
    email: string;
    role: "REVIEWER" | "APPROVER" | "ADMIN";
  }) => {
    try {
      await inviteMutation.mutateAsync(values);
      feedback.success("Internal user invited successfully.");
      form.resetFields();
      setIsInviteModalOpen(false);
      await usersQuery.refetch();
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Failed to invite internal user."),
      );
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus: ManagedUserStatus =
      user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await updateStatusMutation.mutateAsync({
        id: user.id,
        status: nextStatus,
      });
      feedback.success(
        `User ${user.name} has been ${nextStatus.toLowerCase()}.`,
      );
      await usersQuery.refetch();
    } catch (error) {
      feedback.error(
        getAxiosApiErrorMessage(error, "Failed to update user status."),
      );
    }
  };

  const filterContent = (
    <div className="p-2 min-w-[240px]">
      <Space direction="vertical" className="w-full" size="middle">
        <div>
          <Text strong className="text-xs mb-1.5 block text-gray-500 uppercase">
            Filter by Role
          </Text>
          <Select
            placeholder="All Roles"
            allowClear
            className="w-full"
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
            options={[
              { value: "ADMIN", label: "Administrator" },
              { value: "APPROVER", label: "Approver" },
              { value: "REVIEWER", label: "Reviewer" },
              { value: "APPLICANT", label: "Applicant" },
            ]}
          />
        </div>
        <div>
          <Text strong className="text-xs mb-1.5 block text-gray-500 uppercase">
            Filter by Status
          </Text>
          <Select
            placeholder="All Statuses"
            allowClear
            className="w-full"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "DISABLED", label: "DISABLED" },
            ]}
          />
        </div>
        {activeFilterCount > 0 && (
          <Button
            type="link"
            danger
            size="small"
            className="p-0 h-auto text-xs"
            onClick={() => {
              setStatusFilter(undefined);
              setRoleFilter(undefined);
            }}
          >
            Clear all filters
          </Button>
        )}
      </Space>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <Title level={2} className="mb-1!">
            User Management
          </Title>
          <Paragraph type="secondary" className="mb-0!">
            Manage internal regulator accounts and access permissions.
          </Paragraph>
        </div>

        <Space size="middle">
          <Popover
            content={filterContent}
            trigger="click"
            placement="bottomRight"
            arrow={false}
          >
            <Badge count={activeFilterCount} size="small" offset={[-2, 2]}>
              <Button icon={<FilterOutlined />}>Filters</Button>
            </Badge>
          </Popover>
          <Button
            type="primary"
            icon={<Icon icon="lucide:user-plus" />}
            onClick={() => setIsInviteModalOpen(true)}
            className="shadow-none!"
          >
            Invite Internal User
          </Button>
        </Space>
      </div>

      <Card bordered={false} className="shadow-none!">
        <Table
          isPlainTable
          loading={usersQuery.isLoading}
          rowKey="id"
          dataSource={filteredUsers}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Name",
              dataIndex: "name",
              render: (name: string) => <Text strong>{name}</Text>,
            },
            { title: "Email", dataIndex: "email" },
            {
              title: "Roles",
              dataIndex: "roles",
              render: (roles: string[]) => {
                const getRoleColor = (role: string) => {
                  switch (role) {
                    case "ADMIN":
                      return "purple";
                    case "SUPER_ADMIN":
                      return "magenta";
                    case "APPROVER":
                      return "green";
                    case "REVIEWER":
                      return "cyan";
                    default:
                      return "blue";
                  }
                };

                return (
                  <Space size={4}>
                    {roles.map((role) => (
                      <Tag
                        key={role}
                        color={getRoleColor(role)}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {role}
                      </Tag>
                    ))}
                  </Space>
                );
              },
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (status: string) => <StatusIndicator status={status} />,
            },
            {
              title: "Action",
              key: "action",
              width: 80,
              render: (_, record) => {
                const items: MenuProps["items"] = [
                  {
                    key: "toggle-status",
                    label:
                      record.status === "ACTIVE"
                        ? "Disable Account"
                        : "Enable Account",
                    danger: record.status === "ACTIVE",
                    icon: (
                      <Icon
                        icon={
                          record.status === "ACTIVE"
                            ? "lucide:user-x"
                            : "lucide:user-check"
                        }
                      />
                    ),
                    onClick: () => handleToggleStatus(record),
                  },
                ];

                return (
                  <Dropdown
                    menu={{ items }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      className="flex items-center justify-center"
                    />
                  </Dropdown>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        title="Invite Internal User"
        open={isInviteModalOpen}
        onCancel={() => {
          setIsInviteModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInvite}
          className="pt-4"
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Please enter the full name" }]}
          >
            <Input placeholder="e.g. John Doe" />
          </Form.Item>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter the email address" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="e.g. john.doe@bnr.rw" />
          </Form.Item>
          <Form.Item
            label="System Role"
            name="role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select
              placeholder="Select a role"
              options={[
                { value: "REVIEWER", label: "Licensing Reviewer" },
                { value: "APPROVER", label: "Approver" },
                { value: "ADMIN", label: "System Administrator" },
              ]}
            />
          </Form.Item>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
            <Button
              onClick={() => {
                setIsInviteModalOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={inviteMutation.isPending}
              className="shadow-none!"
            >
              Send Invitation
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
