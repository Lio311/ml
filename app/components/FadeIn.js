"use client";

import { motion } from "framer-motion";

export default function FadeIn({ children, delay = 0, direction = "up", className = "", distance = 40, duration = 0.8 }) {
    const getInitialTransform = () => {
        if (direction === "up") return { y: distance, x: 0 };
        if (direction === "down") return { y: -distance, x: 0 };
        if (direction === "left") return { x: distance, y: 0 };
        if (direction === "right") return { x: -distance, y: 0 };
        return { x: 0, y: 0 };
    };

    const initial = { opacity: 0, ...getInitialTransform() };

    return (
        <motion.div
            className={className}
            initial={initial}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
                duration: duration, 
                delay: delay,
                ease: [0.16, 1, 0.3, 1] 
            }}
        >
            {children}
        </motion.div>
    );
}
