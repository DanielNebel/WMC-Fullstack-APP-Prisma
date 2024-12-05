import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getUserById, updateUser, uploadProfilePicture } from "~/utils/user.server";
import { requireUserId } from "~/utils/auth.server";
import { Modal } from "~/components/modal";
import { FormField } from "~/components/form-field";

export const loader: LoaderFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);

    if (!user) {
        throw new Response("User not found", { status: 404 });
    }

    return json({ user });
};

export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const formData = await request.formData();

    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const profilePicture = formData.get("profilePicture") as File;

    if (typeof firstName !== "string" || typeof lastName !== "string") {
        return json({ error: "Invalid form data" }, { status: 400 });
    }

    // Optional: Profilbild hochladen
    let profilePicturePath;
    if (profilePicture && profilePicture.size > 0) {
        profilePicturePath = await uploadProfilePicture(profilePicture);
    }

    // Benutzer aktualisieren
    await updateUser(userId, {
        firstName,
        lastName,
        profilePicture: profilePicturePath,
    });

    return redirect("/home");
};

export default function ProfileSettings() {
    const { user } = useLoaderData();
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture || "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setFormData((form) => ({ ...form, [field]: e.target.value }));
    };

    return (
        <Modal isOpen={true} className="w-1/3">
            <div className="p-3">
                <h2 className="text-4xl font-semibold text-blue-600 text-center mb-4">Your Profile</h2>
                <form method="post" encType="multipart/form-data">
                    <FormField
                        htmlFor="firstName"
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange(e, "firstName")}
                    />
                    <FormField
                        htmlFor="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange(e, "lastName")}
                    />
                    <div className="my-4">
                        <label className="text-blue-600 font-semibold">Profile Picture</label>
                        <input type="file" name="profilePicture" accept="image/*" className="w-full p-2 my-2 rounded-xl" />
                    </div>
                    <div className="w-full text-right">
                        <button
                            type="submit"
                            className="rounded-xl bg-yellow-300 font-semibold text-blue-600 px-16 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
