import { Button } from "@/components/Button";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import Link from "next/link";

const AdminPage = () => {
  return (
    <FormStepLayout
      title="Admin"
      description="Gated by admin permissions"
      actions={
        <div className="flex flex-col gap-4">
          <Link href="/admin/register">
            <Button>Register new user</Button>
          </Link>
          <Link href="/admin/person">
            <Button>Tap person</Button>
          </Link>
          <Link href="/admin/location">
            <Button>Tap location</Button>
          </Link>
          <Link href="/admin/create_quest">
            <Button>Create quest</Button>
          </Link>
          <Link href="/admin/create_item">
            <Button>Create item</Button>
          </Link>
          <Link href="/admin/bench">
            <Button>Benchmarks</Button>
          </Link>
          <Link href="/" className="link text-center">
            Back to home
          </Link>
        </div>
      }
    >
      <></>
    </FormStepLayout>
  );
};

AdminPage.getInitialProps = () => {
  return { showFooter: false, showHeader: true };
};

export default AdminPage;