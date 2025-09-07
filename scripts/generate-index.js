#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob'); // 需要安装 glob 包

async function generateIndex() {
  // 1. 找到所有的 .mdx 文件
  const files = await glob('posts/**/*.mdx');
  
  const indexData = [];

  // 2. 并发处理每个文件，提取 Front Matter
  await Promise.all(files.map(async (filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // 简单的 Front Matter 解析器 (位于 --- 之间)
      const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!fmMatch) return; // 没有 Front Matter 则跳过

      const frontMatter = yaml.load(fmMatch[1]); // 解析 YAML 格式的 Front Matter

      // 3. 提取我们需要的信息
      indexData.push({
        id: frontMatter.id,
        title: frontMatter.title,
        date: new Date(frontMatter.date).toISOString(),
        slug: frontMatter.slug,
        excerpt: frontMatter.excerpt || '',
        filePath: filePath // 记录文件路径以便后续读取
      });
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }));

  // 4. 按日期降序排序
  indexData.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 5. 生成 YAML 内容（去掉不需要的 filePath 字段）
  const yamlContent = yaml.dump(indexData.map(({ filePath, ...keepAttrs }) => keepAttrs));

  // 6. 写入 index.yml 文件
  await fs.writeFile('index.yml', yamlContent, 'utf8');
  console.log('✅ Index.yml generated successfully!');
}

generateIndex().catch(console.error);
