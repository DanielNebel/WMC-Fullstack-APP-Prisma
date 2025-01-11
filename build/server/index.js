import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, createCookieSessionStorage, json, redirect } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, useNavigate, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { createId } from "@paralleldrive/cuid2";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
function Layout$1({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout: Layout$1,
  default: App
}, Symbol.toStringTag, { value: "Module" }));
let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
  prisma.$connect();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
    global.__db.$connect();
  }
  prisma = global.__db;
}
async function uploadProfilePicture(file) {
  if (!file || file.size === 0) {
    return void 0;
  }
  const __dirname = path.resolve();
  const uploadDir = path.join(__dirname, "public", "pps");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const fileExtension = path.extname(file.name) || ".jpg";
  const fileName = `${createId()}${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return `/pps/${fileName}`;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Failed to upload profile picture");
  }
}
const updateUser = async (userId, data) => {
  return await prisma.user.update({
    where: { id: userId },
    data
  });
};
const createUser = async (user) => {
  const passwordHash = await bcrypt.hash(user.password, 10);
  const newUser = await prisma.user.create({
    data: {
      email: user.email,
      password: passwordHash,
      firstName: user.firstName,
      lastName: user.lastName
    }
  });
  return { id: newUser.id, email: user.email };
};
const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: {
      id: userId
    }
  });
};
const getOtherUsers = async (userId) => {
  return prisma.user.findMany({
    where: {
      id: { not: userId }
    },
    orderBy: {
      firstName: "asc"
    }
  });
};
function UserCircle({ user, onClick, className }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `${className} cursor-pointer bg-gray-400 rounded-full flex justify-center items-center`,
      onClick,
      style: {
        backgroundSize: "cover",
        ...user.profilePicture ? { backgroundImage: `url(${user.profilePicture})` } : {}
      },
      children: !user.profilePicture && /* @__PURE__ */ jsxs("h2", { children: [
        user.firstName.charAt(0).toUpperCase(),
        user.lastName.charAt(0).toUpperCase()
      ] })
    }
  );
}
const createWrapper = (wrapperId) => {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", wrapperId);
  document.body.appendChild(wrapper);
  return wrapper;
};
const Portal = ({ children, wrapperId }) => {
  const [wrapper, setWrapper] = useState(null);
  useEffect(() => {
    let element = document.getElementById(wrapperId);
    let created = false;
    if (!element) {
      created = true;
      element = createWrapper(wrapperId);
    }
    setWrapper(element);
    return () => {
      if (created && (element == null ? void 0 : element.parentNode)) {
        element.parentNode.removeChild(element);
      }
    };
  }, [wrapperId]);
  if (wrapper === null) return null;
  return createPortal(children, wrapper);
};
const Modal = ({ children, isOpen, ariaLabel, className }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxs(Portal, { wrapperId: "modal", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 overflow-y-auto bg-gray-600 bg-opacity-80",
        "aria-labelledby": ariaLabel ?? "modal-title",
        role: "dialog",
        "aria-modal": "true",
        onClick: () => navigate("/home")
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 pointer-events-none flex justify-center items-center max-h-screen overflow-scroll", children: /* @__PURE__ */ jsx("div", { className: `${className} p-4 bg-gray-200 pointer-events-auto max-h-screen md:rounded-xl`, children }) })
  ] });
};
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}
const storage = createCookieSessionStorage({
  cookie: {
    name: "kudos-session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true
  }
});
async function createUserSession(userId, redirectTo) {
  const session = await storage.getSession();
  session.set("userId", userId.toString());
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}
async function register(user) {
  const exists = await prisma.user.count({ where: { email: user.email } });
  if (exists) {
    return json(
      { error: `User already exists with that email` },
      { status: 400 }
    );
  }
  const newUser = await createUser(user);
  if (!newUser) {
    return json(
      {
        error: `Something went wrong trying to create a new user.`,
        fields: { email: user.email, password: user.password }
      },
      { status: 400 }
    );
  }
  return createUserSession(newUser.id, "/");
}
async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user || !await bcrypt.compare(password, user.password))
    return json({ error: `Incorrect login` }, { status: 400 });
  return createUserSession(user.id, "/");
}
async function requireUserId(request, redirectTo = new URL(request.url).pathname) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || isNaN(Number(userId))) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return Number(userId);
}
function getUserSession(request) {
  return storage.getSession(request.headers.get("Cookie"));
}
async function getUserId(request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || isNaN(Number(userId))) return null;
  return Number(userId);
}
async function getUser(request) {
  const userId = await getUserId(request);
  if (typeof userId !== "number") {
    return null;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    return user;
  } catch {
    throw logout(request);
  }
}
async function logout(request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session)
    }
  });
}
function SelectBox({
  options = [],
  onChange = () => {
  },
  className = "",
  containerClassName = "",
  name,
  id,
  value,
  label
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    label && /* @__PURE__ */ jsx("label", { htmlFor: id, className: "text-blue-600 font-semibold", children: label }),
    /* @__PURE__ */ jsxs("div", { className: `flex items-center ${containerClassName} my-2`, children: [
      /* @__PURE__ */ jsx(
        "select",
        {
          className: `${className} appearance-none`,
          id,
          name,
          onChange,
          value: value || "",
          children: options.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.name }, option.name))
        }
      ),
      /* @__PURE__ */ jsx(
        "svg",
        {
          className: "w-4 h-4 fill-current text-gray-400 -ml-7 mt-1 pointer-events-none",
          viewBox: "0 0 140 140",
          xmlns: "http://www.w3.org/2000/svg",
          children: /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "m121.3,34.6c-1.6-1.6-4.2-1.6-5.8,0l-51,51.1-51.1-51.1c-1.6-1.6-4.2-1.6-5.8,0-1.6,1.6-1.6,4.2 0,5.8l53.9,53.9c0.8,0.8 1.8,1.2 2.9,1.2 1,0 2.1-0.4 2.9-1.2l53.9-53.9c1.7-1.6 1.7-4.2 0.1-5.8z" }) })
        }
      )
    ] })
  ] });
}
const colorMap = {
  RED: "text-red-400",
  GREEN: "text-green-400",
  BLUE: "text-blue-400",
  WHITE: "text-white",
  YELLOW: "text-yellow-300"
};
const backgroundColorMap = {
  RED: "bg-red-400",
  GREEN: "bg-green-400",
  BLUE: "bg-blue-400",
  WHITE: "bg-white",
  YELLOW: "bg-yellow-300"
};
const emojiMap = {
  THUMBSUP: "👍",
  PARTY: "🎉",
  HANDSUP: "🙌🏻"
};
const sortOptions = [
  {
    name: "Date",
    value: "date"
  },
  {
    name: "Sender Name",
    value: "sender"
  },
  {
    name: "Emoji",
    value: "emoji"
  }
];
function Kudo({ user, kudo }) {
  var _a, _b, _c, _d;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex ${backgroundColorMap[((_a = kudo.style) == null ? void 0 : _a.backgroundColor) || "YELLOW"]} p-4 rounded-xl w-full gap-x-2 relative`,
      children: [
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(UserCircle, { user, className: "h-16 w-16" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxs(
            "p",
            {
              className: `${colorMap[((_b = kudo.style) == null ? void 0 : _b.textColor) || "WHITE"]} font-bold text-lg whitespace-pre-wrap break-all`,
              children: [
                user.firstName,
                " ",
                user.lastName
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "p",
            {
              className: `${colorMap[((_c = kudo.style) == null ? void 0 : _c.textColor) || "WHITE"]} whitespace-pre-wrap break-all`,
              children: kudo.message
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 right-4 bg-white rounded-full h-10 w-10 flex items-center justify-center text-2xl", children: emojiMap[((_d = kudo.style) == null ? void 0 : _d.emoji) || "THUMBSUP"] })
      ]
    }
  );
}
const getRecentKudos = async () => {
  return await prisma.kudo.findMany({
    take: 3,
    orderBy: {
      createdAt: "desc"
    },
    select: {
      style: {
        select: {
          emoji: true
        }
      },
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true
          // profile: true,
        }
      }
    }
  });
};
const getFilteredKudos = async (userId, sortFilter, whereFilter) => {
  return await prisma.kudo.findMany({
    select: {
      id: true,
      message: true,
      style: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          department: true
        }
      }
    },
    orderBy: sortFilter,
    where: {
      recipientId: userId,
      ...whereFilter
    }
  });
};
const createKudo = async (message, userId, recipientId, style) => {
  await prisma.kudo.create({
    data: {
      message,
      author: {
        connect: {
          id: userId
        }
      },
      recipient: {
        connect: {
          id: recipientId
        }
      },
      style: {
        create: {
          backgroundColor: style.backgroundColor,
          textColor: style.textColor,
          emoji: style.emoji
        }
      }
    }
  });
};
const validateEmail = (email) => {
  var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!email.length || !validRegex.test(email)) {
    return "Please enter a valid email address";
  }
};
const validatePassword = (password) => {
  if (password.length < 5) {
    return "Please enter a password that is at least 5 characters long";
  }
};
const validateName = (name) => {
  if (!name.length) return `Please enter a value`;
};
const validColors = ["RED", "GREEN", "YELLOW", "BLUE", "WHITE"];
const validEmojis = ["THUMBSUP", "PARTY", "HANDSUP"];
const validateColor = (color) => {
  return validColors.includes(color);
};
const validateEmoji = (emoji) => {
  return validEmojis.includes(emoji);
};
const loader$5 = async ({ request, params }) => {
  const { userId } = params;
  if (typeof userId !== "string") {
    return redirect("/home");
  }
  const recipient = await getUserById(parseInt(userId));
  const user = await getUser(request);
  return json({ recipient, user });
};
const action$3 = async ({ request }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const message = form.get("message");
  const backgroundColor = form.get("backgroundColor");
  const textColor = form.get("textColor");
  const emoji = form.get("emoji");
  const recipientId = form.get("recipientId");
  if (typeof message !== "string" || typeof recipientId !== "string" || typeof backgroundColor !== "string" || typeof textColor !== "string" || typeof emoji !== "string") {
    return json({ error: `Invalid Form Data` }, { status: 400 });
  }
  if (!message.length) {
    return json({ error: `Please provide a message.` }, { status: 400 });
  }
  if (!recipientId.length) {
    return json({ error: `No recipient found...` }, { status: 400 });
  }
  if (!validateColor(backgroundColor) || !validateColor(textColor)) {
    return json({ error: `Invalid color value.` }, { status: 400 });
  }
  if (!validateEmoji(emoji)) {
    return json({ error: `Invalid emoji value.` }, { status: 400 });
  }
  const recipientIdNum = parseInt(recipientId);
  if (isNaN(recipientIdNum)) {
    return json({ error: `Invalid recipient ID.` }, { status: 400 });
  }
  await createKudo(
    message,
    userId,
    recipientIdNum,
    {
      backgroundColor,
      textColor,
      emoji
    }
  );
  return redirect("/home");
};
function KudoModal() {
  const actionData = useActionData();
  const [formError] = useState((actionData == null ? void 0 : actionData.error) || "");
  const [formData, setFormData] = useState({
    message: "",
    style: {
      backgroundColor: "RED",
      textColor: "WHITE",
      emoji: "THUMBSUP"
    }
  });
  const handleStyleChange = (e, field) => {
    setFormData((data) => ({
      ...data,
      style: {
        ...data.style,
        [field]: e.target.value
      }
    }));
  };
  const getOptions = (data) => Object.keys(data).reduce((acc, curr) => {
    acc.push({
      name: curr.charAt(0).toUpperCase() + curr.slice(1).toLowerCase(),
      value: curr
    });
    return acc;
  }, []);
  const colors = getOptions(colorMap);
  const emojis = getOptions(emojiMap);
  const handleChange = (e, field) => {
    setFormData((data) => ({ ...data, [field]: e.target.value }));
  };
  const {
    recipient,
    user
  } = useLoaderData();
  return /* @__PURE__ */ jsxs(Modal, { isOpen: true, className: "w-2/3 p-10", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-center tracking-wide text-red-500 w-full mb-2", children: formError }),
    /* @__PURE__ */ jsxs("form", { method: "post", children: [
      /* @__PURE__ */ jsx("input", { type: "hidden", value: recipient.id, name: "recipientId" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-y-2 md:gap-y-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center flex flex-col items-center gap-y-2 pr-8", children: [
          /* @__PURE__ */ jsx(UserCircle, { user: recipient, className: "h-24 w-24" }),
          /* @__PURE__ */ jsxs("p", { className: "text-blue-300", children: [
            recipient.firstName,
            " ",
            recipient.lastName
          ] }),
          recipient.department && /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-gray-300 rounded-xl text-blue-300 w-auto", children: recipient.department.charAt(0).toUpperCase() + recipient.department.slice(1).toLowerCase() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-y-4", children: [
          /* @__PURE__ */ jsx(
            "textarea",
            {
              name: "message",
              className: "w-full rounded-xl h-40 p-4",
              value: formData.message,
              onChange: (e) => handleChange(e, "message"),
              placeholder: `Say something nice about ${recipient.firstName}...`
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center md:flex-row md:justify-start gap-x-4", children: [
            /* @__PURE__ */ jsx(
              SelectBox,
              {
                options: colors,
                name: "backgroundColor",
                value: formData.style.backgroundColor,
                onChange: (e) => handleStyleChange(e, "backgroundColor"),
                label: "Background Color",
                containerClassName: "w-36",
                className: "w-full rounded-xl px-3 py-2 text-gray-400"
              }
            ),
            /* @__PURE__ */ jsx(
              SelectBox,
              {
                options: colors,
                name: "textColor",
                value: formData.style.textColor,
                onChange: (e) => handleStyleChange(e, "textColor"),
                label: "Text Color",
                containerClassName: "w-36",
                className: "w-full rounded-xl px-3 py-2 text-gray-400"
              }
            ),
            /* @__PURE__ */ jsx(
              SelectBox,
              {
                options: emojis,
                label: "Emoji",
                name: "emoji",
                value: formData.style.emoji,
                onChange: (e) => handleStyleChange(e, "emoji"),
                containerClassName: "w-36",
                className: "w-full rounded-xl px-3 py-2 text-gray-400"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("p", { className: "text-blue-600 font-semibold mb-2", children: "Preview" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center md:flex-row gap-x-24 gap-y-2 md:gap-y-0", children: [
        /* @__PURE__ */ jsx(Kudo, { user, kudo: formData }),
        /* @__PURE__ */ jsx("div", { className: "flex-1" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "rounded-xl bg-yellow-300 font-semibold text-blue-600 w-80 h-12 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1",
            children: "Send"
          }
        )
      ] })
    ] })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: KudoModal,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
function FormField({
  htmlFor,
  label,
  type = "text",
  value,
  onChange = () => {
  },
  error = ""
}) {
  const [errorText, setErrorText] = useState(error);
  useEffect(() => {
    setErrorText(error);
  }, [error]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("label", { htmlFor, className: "text-blue-600 font-semibold", children: label }),
    /* @__PURE__ */ jsx("input", { onChange: (e) => {
      onChange(e);
      setErrorText("");
    }, type, id: htmlFor, name: htmlFor, className: "w-full p-2 rounded-xl my-2", value }),
    /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-center tracking-wide text-red-500 w-full", children: errorText || "" })
  ] });
}
const loader$4 = async ({ request }) => {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  return json({ user });
};
const action$2 = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const profilePicture = formData.get("profilePicture");
  if (typeof firstName !== "string" || typeof lastName !== "string") {
    return json({ error: "Invalid form data" }, { status: 400 });
  }
  let profilePicturePath;
  if (profilePicture && profilePicture.size > 0) {
    profilePicturePath = await uploadProfilePicture(profilePicture);
  }
  await updateUser(userId, {
    firstName,
    lastName,
    profilePicture: profilePicturePath
  });
  return redirect("/home");
};
function ProfileSettings() {
  const { user } = useLoaderData();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture || ""
  });
  const handleInputChange = (e, field) => {
    setFormData((form) => ({ ...form, [field]: e.target.value }));
  };
  return /* @__PURE__ */ jsx(Modal, { isOpen: true, className: "w-1/3", children: /* @__PURE__ */ jsxs("div", { className: "p-3", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-4xl font-semibold text-blue-600 text-center mb-4", children: "Your Profile" }),
    /* @__PURE__ */ jsxs("form", { method: "post", encType: "multipart/form-data", children: [
      /* @__PURE__ */ jsx(
        FormField,
        {
          htmlFor: "firstName",
          label: "First Name",
          value: formData.firstName,
          onChange: (e) => handleInputChange(e, "firstName")
        }
      ),
      /* @__PURE__ */ jsx(
        FormField,
        {
          htmlFor: "lastName",
          label: "Last Name",
          value: formData.lastName,
          onChange: (e) => handleInputChange(e, "lastName")
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "my-4", children: [
        /* @__PURE__ */ jsx("label", { className: "text-blue-600 font-semibold", children: "Profile Picture" }),
        /* @__PURE__ */ jsx("input", { type: "file", name: "profilePicture", accept: "image/*", className: "w-full p-2 my-2 rounded-xl" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-full text-right", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "rounded-xl bg-yellow-300 font-semibold text-blue-600 px-16 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1",
          children: "Save"
        }
      ) })
    ] })
  ] }) });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: ProfileSettings,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const action$1 = async ({ request }) => logout(request);
const loader$3 = async () => redirect("/");
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({ request }) => {
  await requireUserId(request);
  return redirect("/home");
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
function Layout({ children }) {
  return /* @__PURE__ */ jsx("div", { className: "h-screen w-full bg-blue-600 font-mono", children });
}
const loader$1 = async ({ request }) => {
  return await getUser(request) ? redirect("/") : null;
};
const action = async ({ request }) => {
  const form = await request.formData();
  const action2 = form.get("_action");
  const email = form.get("email");
  const password = form.get("password");
  let firstName = form.get("firstName");
  let lastName = form.get("lastName");
  if (typeof action2 !== "string" || typeof email !== "string" || typeof password !== "string") {
    return json({ error: `Invalid Form Data`, form: action2 }, { status: 400 });
  }
  if (action2 === "register" && (typeof firstName !== "string" || typeof lastName !== "string")) {
    return json({ error: `Invalid Form Data`, form: action2 }, { status: 400 });
  }
  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
    ...action2 === "register" ? {
      firstName: validateName(firstName || ""),
      lastName: validateName(lastName || "")
    } : {}
  };
  if (Object.values(errors).some(Boolean))
    return json({ errors, fields: { email, password, firstName, lastName }, form: action2 }, { status: 400 });
  switch (action2) {
    case "login": {
      return await login({ email, password });
    }
    case "register": {
      firstName = firstName;
      lastName = lastName;
      return await register({ email, password, firstName, lastName });
    }
    default:
      return json({ error: `Invalid Form Data` }, { status: 400 });
  }
};
function Login() {
  var _a, _b, _c, _d;
  const actionData = useActionData();
  const firstLoad = useRef(true);
  const [action2, setAction] = useState("login");
  const [errors, setErrors] = useState((actionData == null ? void 0 : actionData.errors) || {});
  const [formError, setFormError] = useState((actionData == null ? void 0 : actionData.error) || "");
  const [formData, setFormData] = useState({
    email: ((_a = actionData == null ? void 0 : actionData.fields) == null ? void 0 : _a.email) || "",
    password: ((_b = actionData == null ? void 0 : actionData.fields) == null ? void 0 : _b.password) || "",
    firstName: ((_c = actionData == null ? void 0 : actionData.fields) == null ? void 0 : _c.firstName) || "",
    lastName: ((_d = actionData == null ? void 0 : actionData.fields) == null ? void 0 : _d.lastName) || ""
  });
  useEffect(() => {
    if (!firstLoad.current) {
      const newState = {
        email: "",
        password: "",
        firstName: "",
        lastName: ""
      };
      setErrors({});
      setFormError("");
      setFormData(newState);
    }
  }, [action2]);
  useEffect(() => {
    if (!firstLoad.current) {
      setFormError("");
    }
  }, [formData]);
  useEffect(() => {
    firstLoad.current = false;
  }, []);
  useEffect(() => {
    if ((actionData == null ? void 0 : actionData.errors) || (actionData == null ? void 0 : actionData.error)) {
      setErrors(actionData.errors || {});
      setFormError(actionData.error || "");
    }
  }, [actionData]);
  const handleInputChange = (event, field) => {
    setFormData((form) => ({ ...form, [field]: event.target.value }));
  };
  return /* @__PURE__ */ jsx(Layout, { children: /* @__PURE__ */ jsxs("div", { className: "h-full justify-center items-center flex flex-col gap-y-4", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setAction(action2 == "login" ? "register" : "login"),
        className: "absolute top-8 right-8 rounded-xl bg-yellow-300 font-semibold text-blue-600 px-3 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1",
        children: action2 === "login" ? "Sign Up" : "Sign In"
      }
    ),
    /* @__PURE__ */ jsx("h2", { className: "text-5xl font-extrabold text-yellow-300", children: "Welcome to Kudos!" }),
    /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-300", children: action2 === "login" ? "Log In To Give Some Praise!" : "Sign Up To Get Started!" }),
    /* @__PURE__ */ jsxs("form", { method: "POST", className: "rounded-2xl bg-gray-200 p-6 w-96", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-center tracking-wide text-red-500 w-full", children: formError }),
      /* @__PURE__ */ jsx(
        FormField,
        {
          htmlFor: "email",
          label: "Email",
          value: formData.email,
          onChange: (e) => handleInputChange(e, "email"),
          error: errors == null ? void 0 : errors.email
        }
      ),
      /* @__PURE__ */ jsx(
        FormField,
        {
          htmlFor: "password",
          type: "password",
          label: "Password",
          value: formData.password,
          onChange: (e) => handleInputChange(e, "password"),
          error: errors == null ? void 0 : errors.password
        }
      ),
      action2 === "register" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          FormField,
          {
            htmlFor: "firstName",
            label: "First Name",
            onChange: (e) => handleInputChange(e, "firstName"),
            value: formData.firstName,
            error: errors == null ? void 0 : errors.firstName
          }
        ),
        /* @__PURE__ */ jsx(
          FormField,
          {
            htmlFor: "lastName",
            label: "Last Name",
            onChange: (e) => handleInputChange(e, "lastName"),
            value: formData.lastName,
            error: errors == null ? void 0 : errors.lastName
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-full text-center", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          name: "_action",
          value: action2,
          className: "rounded-xl mt-2 bg-yellow-300 px-3 py-2 text-blue-600 font-semibold transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1",
          children: action2 === "login" ? "Sign In" : "Sign Up"
        }
      ) })
    ] })
  ] }) });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: Login,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
function UserPanel({ users }) {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", { className: "w-1/6 bg-gray-200 flex flex-col", children: [
    /* @__PURE__ */ jsx("div", { className: "text-center bg-gray-300 h-20 flex items-center justify-center", children: /* @__PURE__ */ jsx("h2", { className: "text-xl text-blue-600 font-semibold", children: "My Team" }) }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-scroll py-4 flex flex-col gap-y-10", children: users.map((user) => /* @__PURE__ */ jsx(
      UserCircle,
      {
        user,
        className: "h-24 w-24 mx-auto flex-shrink-0",
        onClick: () => navigate(`kudo/${user.id}`)
      },
      user.id
    )) }),
    /* @__PURE__ */ jsx("div", { className: "text-center p-6 bg-gray-300", children: /* @__PURE__ */ jsx("form", { action: "/logout", method: "post", children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        className: "rounded-xl bg-yellow-300 font-semibold text-blue-600 px-3 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1",
        children: "Sign Out"
      }
    ) }) })
  ] });
}
function SearchBar({ user }) {
  const navigate = useNavigate();
  let [searchParams] = useSearchParams();
  const sort = searchParams.get("sort") || "date";
  const filter = searchParams.get("filter") || "";
  const clearFilters = () => {
    searchParams.delete("filter");
    searchParams.delete("sort");
    navigate("/home");
  };
  return /* @__PURE__ */ jsxs("form", { className: "w-full px-6 flex items-center gap-x-4 border-b-4 border-b-blue-900 border-opacity-30 h-20", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center w-2/5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: "filter",
          className: "w-full rounded-xl px-3 py-2",
          placeholder: "Search a message or name",
          defaultValue: filter
        }
      ),
      /* @__PURE__ */ jsxs(
        "svg",
        {
          className: "w-4 h-4 fill-current text-gray-400 -ml-8",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          children: [
            /* @__PURE__ */ jsx("path", { d: "M0 0h24v24H0V0z", fill: "none" }),
            /* @__PURE__ */ jsx("path", { d: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      SelectBox,
      {
        className: "w-full rounded-xl px-3 py-2 text-gray-400",
        containerClassName: "w-40",
        name: "sort",
        options: sortOptions,
        value: sort
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        className: "rounded-xl bg-yellow-300 font-semibold text-blue-600 px-3 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1",
        children: "Search"
      }
    ),
    (filter || sort !== "date") && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: clearFilters,
        className: "rounded-xl bg-red-300 font-semibold text-blue-600 px-3 py-2 transition duration-300 ease-in-out hover:bg-red-400 hover:-translate-y-1",
        children: "Clear Filters"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex-1" }),
    /* @__PURE__ */ jsx(
      UserCircle,
      {
        user,
        className: "h-14 w-14 transition duration-300 ease-in-out hover:scale-110 hover:border-2 hover:border-yellow-300",
        onClick: () => navigate("/home/profile")
      }
    )
  ] });
}
function RecentBar({ kudos }) {
  return /* @__PURE__ */ jsxs("div", { className: "w-1/5 border-l-4 border-l-yellow-300 flex flex-col items-center", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl text-yellow-300 font-semibold my-6", children: "Recent Kudos" }),
    /* @__PURE__ */ jsx("div", { className: "h-full flex flex-col gap-y-10 mt-10", children: kudos.map((kudo) => {
      var _a;
      return /* @__PURE__ */ jsxs("div", { className: "h-24 w-24 relative", children: [
        /* @__PURE__ */ jsx(UserCircle, { user: kudo.recipient, className: "w-20 h-20" }),
        /* @__PURE__ */ jsx("div", { className: "h-8 w-8 text-3xl bottom-2 right-4 rounded-full absolute flex justify-center items-center", children: emojiMap[((_a = kudo == null ? void 0 : kudo.style) == null ? void 0 : _a.emoji) || "THUMBSUP"] })
      ] }, kudo.recipient.id);
    }) })
  ] });
}
const loader = async ({ request }) => {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") || "date";
  const filter = url.searchParams.get("filter");
  let sortOptions2 = {};
  if (sort === "date") {
    sortOptions2 = { createdAt: "desc" };
  } else if (sort === "sender") {
    sortOptions2 = {
      author: {
        firstName: "asc"
      }
    };
  } else if (sort === "emoji") {
    sortOptions2 = {
      style: {
        emoji: "asc"
      }
    };
  } else {
    sortOptions2 = { createdAt: "desc" };
  }
  let textFilter = {};
  if (filter) {
    textFilter = {
      OR: [
        {
          message: {
            contains: filter
          }
        },
        {
          author: {
            OR: [
              {
                firstName: {
                  contains: filter
                }
              },
              {
                lastName: {
                  contains: filter
                }
              }
            ]
          }
        }
      ]
    };
  }
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
  const users = await getOtherUsers(userId);
  const kudos = await getFilteredKudos(userId, sortOptions2, textFilter);
  const recentKudos = await getRecentKudos();
  return json({ user, users, kudos, recentKudos });
};
function Home() {
  const { user, users, kudos, recentKudos } = useLoaderData();
  return /* @__PURE__ */ jsxs(Layout, { children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex", children: [
      /* @__PURE__ */ jsx(UserPanel, { users }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col", children: [
        /* @__PURE__ */ jsx(SearchBar, { user }),
        " ",
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full p-10 flex flex-col gap-y-4", children: kudos.map((kudo) => /* @__PURE__ */ jsx(Kudo, { kudo, user: kudo.author }, kudo.id)) }),
          /* @__PURE__ */ jsx(RecentBar, { kudos: recentKudos })
        ] })
      ] })
    ] })
  ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Home,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-Cqz6KbE1.js", "imports": ["/assets/components-COx0tU5p.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-s12wHkwZ.js", "imports": ["/assets/components-COx0tU5p.js"], "css": ["/assets/root-D_T9bYXx.css"] }, "routes/home.kudo.$userId": { "id": "routes/home.kudo.$userId", "parentId": "routes/home", "path": "kudo/:userId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/home.kudo._userId-DoubeVJf.js", "imports": ["/assets/components-COx0tU5p.js", "/assets/kudo-DZFmgKTc.js", "/assets/modal-CU5wm0ZB.js"], "css": [] }, "routes/home.profile": { "id": "routes/home.profile", "parentId": "routes/home", "path": "profile", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/home.profile-B7bpD7y2.js", "imports": ["/assets/components-COx0tU5p.js", "/assets/modal-CU5wm0ZB.js", "/assets/form-field-CCGULDM1.js"], "css": [] }, "routes/logout": { "id": "routes/logout", "parentId": "root", "path": "logout", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/logout-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/login-DyZdXEuy.js", "imports": ["/assets/components-COx0tU5p.js", "/assets/layout-DqMSPCP_.js", "/assets/form-field-CCGULDM1.js"], "css": [] }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "home", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/home-Bg2EbLL0.js", "imports": ["/assets/components-COx0tU5p.js", "/assets/layout-DqMSPCP_.js", "/assets/kudo-DZFmgKTc.js"], "css": [] } }, "url": "/assets/manifest-94c6a86d.js", "version": "94c6a86d" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "unstable_singleFetch": false, "unstable_lazyRouteDiscovery": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home.kudo.$userId": {
    id: "routes/home.kudo.$userId",
    parentId: "routes/home",
    path: "kudo/:userId",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/home.profile": {
    id: "routes/home.profile",
    parentId: "routes/home",
    path: "profile",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/logout": {
    id: "routes/logout",
    parentId: "root",
    path: "logout",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route4
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: "home",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
