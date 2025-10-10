import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function AnimatedCards({ 
  items = [], 
  onItemClick = null,
  className = "",
  cardType = "default" // "default", "order", "restaurant", "voice"
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      },
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 400,
      },
    },
  };

  // Card content based on type
  const renderCardContent = (item, index) => {
    switch (cardType) {
      case "order":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Order #{item.id}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.status === 'completed' ? 'bg-green-600 text-white' :
                item.status === 'pending' ? 'bg-yellow-600 text-white' :
                item.status === 'cancelled' ? 'bg-red-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {item.status}
              </span>
            </div>
            <p className="text-gray-300 mb-2">{item.restaurant_name}</p>
            <p className="text-fuchsia-400 font-bold">${item.total}</p>
            <p className="text-sm text-gray-400 mt-2">
              {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        );

      case "restaurant":
        return (
          <div className="p-6">
            <div className="w-full h-32 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {item.name?.charAt(0) || 'R'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {item.name}
            </h3>
            <p className="text-gray-300 text-sm mb-2">{item.cuisine_type}</p>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★</span>
              <span className="text-gray-300">{item.rating || '4.5'}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{item.delivery_time || '25-30 min'}</span>
            </div>
          </div>
        );

      case "voice":
        return (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎤</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {item.title || 'Voice Command'}
            </h3>
            <p className="text-gray-300 text-sm">
              {item.description || 'Click to start voice interaction'}
            </p>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              {item.title || item.name || `Item ${index + 1}`}
            </h3>
            <p className="text-gray-300 text-sm">
              {item.description || item.content || 'No description available'}
            </p>
            {item.subtitle && (
              <p className="text-fuchsia-400 text-xs mt-2">{item.subtitle}</p>
            )}
          </div>
        );
    }
  };

  if (!items || items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-center py-12 ${className}`}
      >
        <div className="text-gray-400 text-lg">No items to display</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          variants={cardVariants}
          whileHover="hover"
          onHoverStart={() => setHoveredIndex(index)}
          onHoverEnd={() => setHoveredIndex(null)}
          onClick={() => onItemClick && onItemClick(item, index)}
          className={`
            bg-gray-800 rounded-xl shadow-lg cursor-pointer overflow-hidden
            border border-gray-700 hover:border-fuchsia-500/50
            transition-all duration-300
            ${onItemClick ? 'hover:shadow-fuchsia-500/20' : ''}
          `}
        >
          {renderCardContent(item, index)}
          
          {/* Hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: hoveredIndex === index ? 0.1 : 0 
            }}
            className="absolute inset-0 bg-fuchsia-500 pointer-events-none"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}


