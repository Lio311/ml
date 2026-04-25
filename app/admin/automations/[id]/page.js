import { query } from "../../../../lib/db";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import WorkflowEditor from "../../../../components/admin/automations/WorkflowEditor";

export default async function EditWorkflowPage({ params }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const { id } = params;

    const res = await query(`
        SELECT * FROM workflows WHERE id = $1
    `, [id]);

    const workflow = res.rows[0];

    if (!workflow) {
        notFound();
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <WorkflowEditor workflowId={id} initialData={workflow} />
        </div>
    );
}
