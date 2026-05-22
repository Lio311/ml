"use client";

import { motion } from 'framer-motion';

export default function FadeIn({ children, delay = 0, direction = "up", className = "", distance = 40, duration = 0.8 }) {
    const variants = {
        hidden: {
            opacity: 0,
            y: direction === "up" ? distance : direction === "down" ? -distance : 0,
            x: direction === "left" ? distance : direction === "right" ? -distance : 0,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration: duration,
                ease: [0.16, 1, 0.3, 1], // easeOutExpo for a very smooth luxury feel
                delay: delay
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "150px" }} // Triggers just before the element enters the viewport
            className={className}
        >
            {children}
        </motion.div>
    );
}
