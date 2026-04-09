"use client";
import React from "react";
import { motion } from "motion/react";
import rajeshImg from "@/assets/testimonials/ind_rajesh.png";
import sunitaImg from "@/assets/testimonials/ind_sunita.png";
import amitImg from "@/assets/testimonials/ind_amit.png";
import priyankaImg from "@/assets/testimonials/ind_priyanka.png";
import sureshImg from "@/assets/testimonials/ind_suresh.png";
import vikramImg from "@/assets/testimonials/ind_vikram.png";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";

const testimonials = [
  {
    text: "KrishiSaathi has revolutionized how I sell my grapes. No more middleman headaches, and I get paid instantly!",
    image: rajeshImg,
    name: "Rajesh Kumar",
    role: "Progressive Farmer, Nasik",
  },
  {
    text: "The platform's focus on quality helps me get the premium my organic produce deserves. Truly a blessing for us.",
    image: sunitaImg,
    name: "Sunita Deshmukh",
    role: "Organic Farmer, Pune",
  },
  {
    text: "Real-time mandi rates and direct-to-consumer reach have boosted my monthly income by 30%. Very easy to use.",
    image: amitImg,
    name: "Amit Patel",
    role: "Dairy Farmer, Anand",
  },
  {
    text: "As a woman in agriculture, this platform gave me the digital tools to scale my herbal farm globally.",
    image: priyankaImg,
    name: "Priyanka Sharma",
    role: "Agri-Entrepreneur, Bhopal",
  },
  {
    text: "The logistics support is seamless. My coffee beans reach cafes in Bangalore within 24 hours of harvest.",
    image: sureshImg,
    name: "Suresh Hegde",
    role: "Coffee Planter, Coorg",
  },
  {
    text: "Stable prices and transparent payments—KrishiSaathi is a game changer for wheat farmers like me in Punjab.",
    image: vikramImg,
    name: "Vikram Singh",
    role: "Grain Farmer, Ludhiana",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(0, 3);

const InfiniteTestimonials = () => {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-primary/20 py-1 px-4 rounded-full text-primary text-sm font-medium tracking-wider uppercase bg-primary/10">
              Success Stories
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-center">
            Trusted by Thousands of <span className="text-primary">Farming Families</span>
          </h2>
          <p className="text-center mt-5 opacity-75 md:text-lg">
            Hear directly from the farmers who are transforming Indian agriculture with KrishiSaathi.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default InfiniteTestimonials;
