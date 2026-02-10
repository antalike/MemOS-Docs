---
title: Linux API Version
desc: "MemCube is the core component of MemOS, like a 'memory chip' in Cyberpunk 2077, allowing agents to load different 'memory packages' to gain different knowledge and abilities. In this chapter, we will help you master the basic operations of MemCube through three progressive recipes.<br/>Note that the MemOS system has two levels: OS level and Cube level. Here we first introduce the more basic Cube level. Many of the operations below, such as add and search operations, also exist at the OS level. The difference is: OS manages multiple Cubes and can perform overall search and operations on multiple Cubes, while Cube is only responsible for its own writing and querying."
---

### Recipe 1.1: Install and Configure Your MemOS Development Environment (API Version)

**🎯 Problem Scenario:** You are an AI application developer who wants to try the latest and hottest MemOS, but don't know how to configure the MemOS environment.

**🔧 Solution:** Through this recipe, you will learn how to build a complete MemOS environment from scratch.

#### Step 1: Check System Requirements

```bash
# Check Python version (requires 3.10+)
python --version

# 💡 If version is lower than 3.10, please upgrade Python first
```

#### Step 2: Install MemOS

**Option A: Production Environment Installation (Recommended)**

```bash
# 🎯 Quick installation, suitable for production use
pip install MemoryOS chonkie qdrant_client markitdown
```

**Option B: Development Environment Installation (For Contributors)**

```bash
# 🎯 Clone source code and install development environment
git clone https://github.com/MemTensor/MemOS.git
cd MemOS

# 🎯 Install using make (will automatically handle dependencies and virtual environment)
make install

# 🎯 Activate Poetry virtual environment
poetry shell
# Or use: poetry run python your_script.py
```

#### Step 3: Configure OpenAI API Environment Variables

Create `.env` file:

```bash
# .env
# 🎯 OpenAI configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1

# 🎯 MemOS specific configuration
MOS_TEXT_MEM_TYPE=general_text
MOS_USER_ID=default_user
MOS_TOP_K=5
```

#### Step 4: Verify Installation and Complete Environment

Create verification file `test_memos_setup_api_mode.py`:

```python
# test_memos_setup_api_mode.py
# 🎯 API mode verification script - using OpenAI API and MOS.simple()
import os
import sys
from dotenv import load_dotenv

def check_openai_environment():
    """🎯 Check OpenAI environment variable configuration"""
    print("🔍 Checking OpenAI environment variable configuration...")
  
    # Load .env file
    load_dotenv()
  
    # Check OpenAI configuration
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
  
    print(f"📋 OpenAI environment variable status:")
  
    if openai_key:
        masked_key = openai_key[:8] + "..." + openai_key[-4:] if len(openai_key) > 12 else "***"
        print(f"  ✅ OPENAI_API_KEY: {masked_key}")
        print(f"  ✅ OPENAI_API_BASE: {openai_base}")
        return True
    else:
        print(f"  ❌ OPENAI_API_KEY: Not configured")
        print(f"  ❌ OPENAI_API_BASE: {openai_base}")
        return False

def check_memos_installation():
    """🎯 Check MemOS installation status"""
    print("\n🔍 Checking MemOS installation status...")
  
    try:
        import memos
        print(f"✅ MemOS version: {memos.__version__}")
      
        # Test core component import
        from memos.mem_cube.general import GeneralMemCube
        from memos.mem_os.main import MOS
        from memos.configs.mem_os import MOSConfig
      
        print("✅ Core components imported successfully")
        return True
      
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Other error: {e}")
        return False

def test_api_functionality():
    """🎯 Test API mode functionality"""
    print("\n🔍 Testing API mode functionality...")
  
    try:
        from memos.mem_os.main import MOS
      
        # Use default MOS.simple() method
        print("🚀 Creating MOS instance (using MOS.simple())...")
        memory = MOS.simple()
      
        print("✅ MOS.simple() created successfully!")
        print(f"  📊 User ID: {memory.user_id}")
        print(f"  📊 Session ID: {memory.session_id}")
      
        # Test adding memory
        print("\n🧠 Testing adding memory...")
        memory.add(memory_content="This is a test memory in API mode")
        print("✅ Memory added successfully!")
      
        # Test chat functionality
        print("\n💬 Testing chat functionality...")
        response = memory.chat("What memory did I just add?")
        print(f"✅ Chat response: {response}")
      
        # Test search functionality
        print("\n🔍 Testing search functionality...")
        search_results = memory.search("test memory", top_k=3)
        if search_results and search_results.get("text_mem"):
            print(f"✅ Search successful, found {len(search_results['text_mem'])} results")
        else:
            print("⚠️ Search returned no results")
      
        print("✅ API mode functionality test successful!")
        return True
      
    except Exception as e:
        print(f"❌ API mode functionality test failed: {e}")
        print("💡 Tip: Please check OpenAI API key and network connection.")
        return False

def main():
    """🎯 API mode main verification process"""
    print("🚀 Starting MemOS API mode environment verification...\n")
  
    # Step 1: Check OpenAI environment variables
    env_ok = check_openai_environment()
  
    # Step 2: Check installation status
    install_ok = check_memos_installation()
  
    # Step 3: Test functionality
    if env_ok and install_ok:
        func_ok = test_api_functionality()
    else:
        func_ok = False
        if not env_ok:
            print("\n⚠️ Skipping functionality test due to incomplete OpenAI environment variable configuration")
        elif not install_ok:
            print("\n⚠️ Skipping functionality test due to MemOS installation failure")
  
    # Summary
    print("\n" + "="*50)
    print("📊 API mode verification results summary:")
    print(f"  OpenAI environment variables: {'✅ Passed' if env_ok else '❌ Failed'}")
    print(f"  MemOS installation: {'✅ Passed' if install_ok else '❌ Failed'}")
    print(f"  Functionality test: {'✅ Passed' if func_ok else '❌ Failed'}")
  
    if env_ok and install_ok and func_ok:
        print(f"\n🎉 Congratulations! MemOS API mode environment configuration completely successful!")
        print(f"💡 You can now start using MemOS API mode.")
    elif install_ok and env_ok:
        print(f"\n⚠️ MemOS is installed and OpenAI is configured, but functionality test failed.")
        print(f"💡 Please check if OpenAI API key is valid and network connection is normal.")
    elif install_ok:
        print("\n⚠️ MemOS is installed, but need to configure OpenAI environment variables to use normally.")
        print("💡 Please configure OPENAI_API_KEY in .env file.")
    else:
        print("\n❌ Environment configuration has problems, please check the error messages above.")
  
    return bool(env_ok and install_ok and func_ok)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 
```

Run API mode verification:

```bash
python test_memos_setup_api_mode.py
```

#### Common Problems and Solutions

**Q1: What to do if macOS installation fails?**

```bash
# 🔧 macOS may need additional configuration
export SYSTEM_VERSION_COMPAT=1
pip install MemoryOS
```

**Q2: How to resolve dependency conflicts?**

```bash
# 🔧 Use virtual environment for isolation
python -m venv memos_env
source memos_env/bin/activate  # Linux/macOS
# or memos_env\Scripts\activate  # Windows
pip install MemoryOS
```

### Recipe 1.2: Build a Simple MemCube from Document Files (API Version)

**🎯 Problem Scenario:** You have a PDF document containing company knowledge base and want to create a "memory chip" that can answer related questions.

**🔧 Solution:** Through this recipe, you will learn how to use MemReader to convert documents into searchable MemCube. MemReader is a core component of MemOS that can intelligently parse documents and extract structured memories.

#### Step 1: Prepare Sample Document

Create a sample knowledge document `company_handbook.txt`:

```text
# Company Employee Handbook

## Working Hours
The company's standard working hours are Monday to Friday, 9:00 AM to 6:00 PM.
Flexible working hours allow employees to start work between 8:00-10:00 AM.

## Leave Policy
- Annual leave: 15 days paid annual leave per year
- Sick leave: 7 days paid sick leave per year
- Personal leave: 3 days personal affairs leave per year

## Benefits
The company provides comprehensive five insurances and one fund, including:
- Pension insurance
- Medical insurance
- Unemployment insurance
- Work injury insurance
- Maternity insurance
- Housing provident fund

Additional benefits include annual health checkups, team building activities, and training subsidies.

## Office Equipment
Each employee will receive:
- One laptop
- One monitor
- Ergonomic chair
- Office desk

## Contact Information
HR Department: hr@company.com
IT Support: it@company.com
Finance Department: finance@company.com
```

#### Step 2: Create MemCube using MemReader

```python
# create_memcube_with_memreader_api.py
# 🎯 Complete process of creating MemCube using MemReader (API version)
import os
import uuid
from dotenv import load_dotenv
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_reader import MemReaderConfigFactory
from memos.mem_reader.factory import MemReaderFactory

def create_memcube_with_memreader():
    """
    🎯 Complete process of creating MemCube using MemReader (API version)
    """
  
    print("🔧 Creating MemCube configuration...")
  
    # Load environment variables
    load_dotenv()
  
    # Get OpenAI configuration
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
  
    if not openai_key:
        raise ValueError("❌ OPENAI_API_KEY not configured. Please configure OpenAI API key in .env file.")
  
    print("✅ Detected OpenAI API mode")
  
    # Get MemOS configuration
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
  
    # OpenAI mode configuration
    cube_config = {
        "user_id": user_id,
        "cube_id": f"{user_id}_company_handbook_cube",
        "text_mem": {
            "backend": "general_text",
            "config": {
                "extractor_llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-4o-mini",
                        "temperature": 0.8,
                        "max_tokens": 8192,
                        "top_p": 0.9,
                        "top_k": 50,
                        "api_key": openai_key,
                        "api_base": openai_base
                    }
                },
                "embedder": {
                    "backend": "universal_api",
                    "config": {
                        "provider": "openai",
                        "api_key": openai_key,
                        "model_name_or_path": "text-embedding-ada-002",
                        "base_url": openai_base
                    }
                },
                "vector_db": {
                    "backend": "qdrant",
                    "config": {
                        "collection_name": f"{user_id}_company_handbook",
                        "vector_dimension": 1536,
                        "distance_metric": "cosine"
                    }
                }
            }
        },
        "act_mem": {"backend": "uninitialized"},
        "para_mem": {"backend": "uninitialized"}
    }
  
    # Create MemCube instance
    config_obj = GeneralMemCubeConfig.model_validate(cube_config)
    mem_cube = GeneralMemCube(config_obj)
  
    print("✅ MemCube created successfully!")
    print(f"  📊 User ID: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 Text memory backend: {mem_cube.config.text_mem.backend}")
    print(f"  🔍 Embedding model: text-embedding-ada-002 (OpenAI)")
    print(f"  🎯 Configuration mode: OPENAI API")
  
    return mem_cube

def create_memreader_config():
    """
    🎯 Create MemReader configuration
    """
  
    # Load environment variables
    load_dotenv()
  
    # Get OpenAI configuration
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
  
    # MemReader configuration
    mem_reader_config = MemReaderConfigFactory(
        backend="simple_struct",
        config={
            "llm": {
                "backend": "openai",
                "config": {
                    "model_name_or_path": "gpt-4o-mini",
                    "temperature": 0.8,
                    "max_tokens": 8192,
                    "top_p": 0.9,
                    "top_k": 50,
                    "api_key": openai_key,
                    "api_base": openai_base
                }
            },
            "embedder": {
                "backend": "universal_api",
                "config": {
                    "provider": "openai",
                    "api_key": openai_key,
                    "model_name_or_path": "text-embedding-ada-002",
                    "base_url": openai_base
                }
            },
            "chunker": {
                "backend": "sentence",
                "config": {
                    "chunk_size": 64,
                    "chunk_overlap": 20,
                    "min_sentences_per_chunk": 1
                }
            },
            "remove_prompt_example": False
        }
    )
  
    return mem_reader_config

def load_document_to_memcube(mem_cube, doc_path):
    """
    🎯 Load document to MemCube using MemReader
    """
  
    print(f"\n📖 Reading document using MemReader: {doc_path}")
  
    # Create MemReader
    mem_reader_config = create_memreader_config()
    mem_reader = MemReaderFactory.from_config(mem_reader_config)
  
    # Prepare document data
    print("📄 Preparing document data...")
    documents = [doc_path]  # MemReader expects list of document paths
  
    # Use MemReader to process documents
    print("🧠 Extracting memories using MemReader...")
    memories = mem_reader.get_memory(
        documents,
        type="doc",
        info={
            "user_id": mem_cube.config.user_id, 
            "session_id": str(uuid.uuid4())
        }
    )
  
    print(f"📚 MemReader generated {len(memories)} memory fragments")
  
    # Add memories to MemCube
    print("💾 Adding memories to MemCube...")
    for mem in memories:
        mem_cube.text_mem.add(mem)
  
    print(f"✅ Successfully added {len(memories)} memory fragments to MemCube")
  
    # Output basic information
    print("\n📊 MemCube basic information:")
    print(f"  📁 Document source: {doc_path}")
    print(f"  📝 Number of memory fragments: {len(memories)}")
    print(f"  🏷️ Document type: company_handbook")
    print(f"  💾 Vector database: Qdrant (memory mode, deleted when memory is released)")
    print(f"  🔍 Embedding model: text-embedding-ada-002 (OpenAI)")
    print(f"  🎯 Configuration mode: OPENAI API")
    print(f"  🧠 Memory extractor: MemReader (simple_struct)")
  
    return mem_cube

if __name__ == "__main__":
    print("🚀 Starting to create document MemCube using MemReader (API version)...")
  
    # Create MemCube
    mem_cube = create_memcube_with_memreader()
  
    # Load document
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
  
    print("\n🎉 MemCube creation completed!") 
```

#### Run Example

```bash
# Step 2: Create MemCube
python create_memcube_with_memreader_api.py
```

#### Step 3: Test Search and Chat Functionality

> In the current MemOS version, running chat without enabling Scheduler will cause some issues. You need to manually comment out a code block as follows to run all subsequent example codes normally. We will fix this issue in future versions.
> Ctrl+click on the chat() function below, then click super.chat() to enter core.py, or find lib/python3.12/site-packages/memos/mem_os/core.py in the environment installation directory and search for def chat to locate the corresponding function
> Comment out the code block above return at the end of the function:

```
# submit message to scheduler
# for accessible_mem_cube in accessible_cubes:
#     mem_cube_id = accessible_mem_cube.cube_id
#     mem_cube = self.mem_cubes[mem_cube_id]
#     if self.enable_mem_scheduler and self.mem_scheduler is not None:
#         message_item = ScheduleMessageItem(
#             user_id=target_user_id,
#             mem_cube_id=mem_cube_id,
#             mem_cube=mem_cube,
#             label=ANSWER_LABEL,
#             content=response,
#             timestamp=datetime.now(),
#         )
#         self.mem_scheduler.submit_messages(messages=[message_item])
```

```python
# test_memcube_search_and_chat_api.py
# 🎯 Test MemCube search and chat functionality (API version)
import os
from dotenv import load_dotenv
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS

def create_mos_config():
    """
    🎯 Create MOS configuration (API version)
    """
    load_dotenv()
  
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
  
    if not openai_key:
        raise ValueError("❌ OPENAI_API_KEY not configured. Please configure OpenAI API key in .env file.")
  
    # OpenAI mode configuration
    return MOSConfig(
        user_id=user_id,
        chat_model={
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-3.5-turbo",
                "api_key": openai_key,
                "api_base": openai_base,
                "temperature": 0.1,
                "max_tokens": 1024,
            }
        },
        mem_reader={
            "backend": "simple_struct",
            "config": {
                "llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-3.5-turbo",
                        "api_key": openai_key,
                        "api_base": openai_base,
                    }
                },
                "embedder": {
                    "backend": "universal_api",
                    "config": {
                        "provider": "openai",
                        "api_key": openai_key,
                        "model_name_or_path": "text-embedding-ada-002",
                        "base_url": openai_base,
                    }
                },
                "chunker": {
                    "backend": "sentence",
                    "config": {
                        "tokenizer_or_token_counter": "gpt2",
                        "chunk_size": 512,
                        "chunk_overlap": 128,
                        "min_sentences_per_chunk": 1,
                    }
                }
            }
        },
        enable_textual_memory=True,
        top_k=top_k
    )

def test_memcube_search_and_chat():
    """
    🎯 Test MemCube search and chat functionality (API version)
    """
  
    print("🚀 Starting to test MemCube search and chat functionality (API version)...")
  
    # Import functions from step 2
    from create_memcube_with_memreader_api import create_memcube_with_memreader, load_document_to_memcube
  
    # Create MemCube and load document
    print("\n1️⃣ Creating MemCube and loading document...")
    mem_cube = create_memcube_with_memreader()
    # Load document
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
  
    # Create MOS configuration
    print("\n2️⃣ Creating MOS configuration...")
    mos_config = create_mos_config()
  
    # Create MOS instance and register MemCube
    print("3️⃣ Creating MOS instance and registering MemCube...")
    mos = MOS(mos_config)
    mos.register_mem_cube(mem_cube, mem_cube_id="handbook")
  
    print("✅ MOS instance created successfully!")
    print(f"  📊 User ID: {mos.user_id}")
    print(f"  📊 Session ID: {mos.session_id}")
    print(f"  📊 Registered MemCubes: {list(mos.mem_cubes.keys())}")
    print(f"  🎯 Configuration mode: OPENAI API")
    print(f"  🤖 Chat model: gpt-3.5-turbo (OpenAI)")
    print(f"  🔍 Embedding model: text-embedding-ada-002 (OpenAI)")
  
    # Test search functionality
    print("\n🔍 Testing search functionality...")
    test_queries = [
        "What are the company's working hours?",
        "How many days of annual leave?",
        "What benefits are available?",
        "How to contact HR department?"
    ]
  
    for query in test_queries:
        print(f"\n❓ Query: {query}")
      
        # Use MOS search
        search_results = mos.search(query, top_k=2)
      
        if search_results and search_results.get("text_mem"):
            print(f"📋 Found {len(search_results['text_mem'])} relevant results:")
            for cube_result in search_results['text_mem']:
                cube_id = cube_result['cube_id']
                memories = cube_result['memories']
                print(f"  📦 MemCube: {cube_id}")
                for i, memory in enumerate(memories[:2], 1):  # Show only first 2 results
                    print(f"    {i}. {memory.memory[:100]}...")
        else:
            print("😓 No relevant results found")
  
    # Test chat functionality
    print("\n💬 Testing chat functionality...")
    chat_questions = [
        "How are the company's working hours arranged?",
        "What benefits can employees enjoy?",
        "How to contact IT support department?"
    ]
  
    for question in chat_questions:
        print(f"\n👤 Question: {question}")
      
        try:
            response = mos.chat(question)
            print(f"🤖 Answer: {response}")
        except Exception as e:
            print(f"❌ Chat failed: {e}")
  
    print("\n🎉 Test completed!")
    return mos

if __name__ == "__main__":
    test_memcube_search_and_chat() 
```

#### Run Example

```bash
# Step 3: Test search and chat
python test_memcube_search_and_chat_api.py
```

### Recipe 1.3: MemCube Basic Operations: Create, Add Memory, Save, Load, Query, Delete (API Version)

**🎯 Problem Scenario:** You have created several MemCubes: company regulations, company personnel, company knowledge base... You need to learn how to effectively manage their complete lifecycle: create, add memory, save to disk, load from disk, query in memory (basic queries and advanced metadata queries), and clean up unnecessary MemCubes (remove from memory and delete files).

**🔧 Solution:** Master the complete lifecycle management of MemCube, including intelligent configuration, basic queries, advanced metadata operations, and fine-grained memory and file management.

#### Step 1: Complete MemCube Lifecycle Management

```python
 # memcube_lifecycle_api.py
# 🎯 MemCube lifecycle management: create, add memory, save, load, query, delete (API version)
import os
import shutil
import time
from pathlib import Path
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig

class MemCubeManager:
    """
    🎯 MemCube lifecycle manager (API version)
    """
  
    def __init__(self, storage_root="./memcube_storage"):
        self.storage_root = Path(storage_root)
        self.storage_root.mkdir(exist_ok=True)
        self.loaded_cubes = {}  # MemCube cache in memory
  
    def create_empty_memcube(self, cube_id: str) -> GeneralMemCube:
        """
        🎯 Create an empty MemCube (without sample data)
        """
      
        # Load environment variables
        load_dotenv()
      
        # Get OpenAI configuration
        openai_key = os.getenv("OPENAI_API_KEY")
        openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
      
        if not openai_key:
            raise ValueError("❌ OPENAI_API_KEY not configured. Please configure OpenAI API key in .env file.")
      
        # Get MemOS configuration
        user_id = os.getenv("MOS_USER_ID", "demo_user")
      
        # OpenAI mode configuration
        cube_config = {
            "user_id": user_id,
            "cube_id": cube_id,
            "text_mem": {
                "backend": "general_text",
                "config": {
                    "extractor_llm": {
                        "backend": "openai",
                        "config": {
                            "model_name_or_path": "gpt-4o-mini",
                            "temperature": 0.8,
                            "max_tokens": 8192,
                            "top_p": 0.9,
                            "top_k": 50,
                            "api_key": openai_key,
                            "api_base": openai_base
                        }
                    },
                    "embedder": {
                        "backend": "universal_api",
                        "config": {
                            "provider": "openai",
                            "api_key": openai_key,
                            "model_name_or_path": "text-embedding-ada-002",
                            "base_url": openai_base
                        }
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": f"collection_{cube_id}_{int(time.time())}",
                            "vector_dimension": 1536,
                            "distance_metric": "cosine"
                        }
                    }
                }
            },
            "act_mem": {"backend": "uninitialized"},
            "para_mem": {"backend": "uninitialized"}
        }
      
        config_obj = GeneralMemCubeConfig.model_validate(cube_config)
        mem_cube = GeneralMemCube(config_obj)
      
        print(f"✅ Created empty MemCube: {cube_id}")
        return mem_cube
  
    def save_memcube(self, mem_cube: GeneralMemCube, cube_id: str) -> str:
        """
        🎯 Save MemCube to disk
        """
  
        save_path = self.storage_root / cube_id
  
        print(f"💾 Saving MemCube to: {save_path}")
  
        try:
            # ⚠️ If directory exists, clean it first
            if save_path.exists():
                shutil.rmtree(save_path)
      
            # Save MemCube
            mem_cube.dump(str(save_path))
      
            print(f"✅ MemCube '{cube_id}' saved successfully")
            return str(save_path)
      
        except Exception as e:
            print(f"❌ Save failed: {e}")
            raise
  
    def load_memcube(self, cube_id: str) -> GeneralMemCube:
        """
        🎯 Load MemCube from disk
        """
  
        load_path = self.storage_root / cube_id
  
        if not load_path.exists():
            raise FileNotFoundError(f"MemCube '{cube_id}' does not exist at {load_path}")
  
        print(f"📂 Loading MemCube from disk: {load_path}")
  
        try:
            # Load MemCube from directory
            mem_cube = GeneralMemCube.init_from_dir(str(load_path))
      
            # Cache to memory
            self.loaded_cubes[cube_id] = mem_cube
      
            print(f"✅ MemCube '{cube_id}' loaded successfully")
            return mem_cube
      
        except Exception as e:
            print(f"❌ Load failed: {e}")
            raise
  
    def list_saved_memcubes(self) -> list:
        """
        🎯 List all saved MemCubes
        """
  
        saved_cubes = []
  
        for item in self.storage_root.iterdir():
            if item.is_dir():
                # Check if it's a valid MemCube directory
                readme_path = item / "README.md"
                if readme_path.exists():
                    saved_cubes.append({
                        "cube_id": item.name,
                        "path": str(item),
                        "size": self._get_dir_size(item)
                    })
  
        return saved_cubes
  
    def unload_memcube(self, cube_id: str) -> bool:
        """
        🎯 Remove MemCube from memory (don't delete files)
        """
      
        if cube_id in self.loaded_cubes:
            del self.loaded_cubes[cube_id]
            print(f"♻️ MemCube '{cube_id}' removed from memory")
            return True
        else:
            print(f"⚠️ MemCube '{cube_id}' not in memory")
            return False
  
    def delete_memcube(self, cube_id: str) -> bool:
        """
        🎯 Delete MemCube local files
        """
      
        delete_path = self.storage_root / cube_id
      
        if not delete_path.exists():
            print(f"⚠️ MemCube '{cube_id}' does not exist at {delete_path}")
            return False
      
        print(f"🗑️ Deleting MemCube files: {delete_path}")
      
        try:
            # Delete directory
            shutil.rmtree(delete_path)
          
            # Remove from memory cache (if still in memory)
            if cube_id in self.loaded_cubes:
                del self.loaded_cubes[cube_id]
          
            print(f"✅ MemCube '{cube_id}' files deleted successfully")
            return True
          
        except Exception as e:
            print(f"❌ Delete failed: {e}")
            return False
  
    def _get_dir_size(self, path: Path) -> str:
        """Calculate directory size"""
        total_size = sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
        return f"{total_size / 1024:.1f} KB"

def add_memories_to_cube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Add memories to MemCube
    """
  
    print(f"🧠 Adding memories to {cube_name}...")
  
    # Add some sample memories (with rich metadata)
    memories = [
        {"memory": f"Azhen fell in love with Aqiang", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"Azhen is 1.5 meters tall", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}},
        {"memory": f"Azhen is an assassin", "metadata": {"type": "fact", "source": "web", "confidence": 0.7}},
        {"memory": f"Aqiang is a programmer", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"Aqiang likes to write code", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}}
    ]
  
    mem_cube.text_mem.add(memories)
  
    print(f"✅ Successfully added {len(memories)} memories to {cube_name}")
  
    # Show current memory count
    all_memories = mem_cube.text_mem.get_all()
    print(f"📊 {cube_name} current total memory count: {len(all_memories)}")

def basic_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Basic MemCube query
    """
  
    print(f"🔍 Basic query for {cube_name}:")
  
    # Get all memories
    all_memories = mem_cube.text_mem.get_all()
    print(f"  📊 Total memory count: {len(all_memories)}")
  
    # Search specific content
    search_results = mem_cube.text_mem.search("love", top_k=1)
    print(f"  🎯 Search results for 'love': {len(search_results)} items")
  
    for i, result in enumerate(search_results, 1):
        print(f"    {i}. {result.memory}")

def advanced_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 Advanced MemCube query (metadata operations)
    """
  
    print(f"🔬 Advanced query for {cube_name}:")
  
    # Get all memories
    all_memories = mem_cube.text_mem.get_all()
  
    # 1. Show complete structure of TextualMemoryItem
    print("  📋 Complete structure of first memory:")
    first_memory = all_memories[0]
    print(f"    {first_memory}")
    print(f"    ID: {first_memory.id}")
    print(f"    Content: {first_memory.memory}")
    print(f"    Metadata: {first_memory.metadata}")
    print(f"    Type: {first_memory.metadata.type}")
    print(f"    Source: {first_memory.metadata.source}")
    print(f"    Confidence: {first_memory.metadata.confidence}")
    print()
  
    # 2. Metadata filtering
    print("  🔍 Metadata filtering:")
  
    # Filter high confidence memories
    high_confidence = [m for m in all_memories if m.metadata.confidence and m.metadata.confidence >= 0.9]
    print(f"    High confidence memories (>=0.9): {len(high_confidence)} items")
    for i, memory in enumerate(high_confidence, 1):
        print(f"      {i}. {memory.memory} (confidence: {memory.metadata.confidence})")
  
    # Filter memories from specific source
    conversation_memories = [m for m in all_memories if m.metadata.source == "conversation"]
    print(f"    Conversation source memories: {len(conversation_memories)} items")
    for i, memory in enumerate(conversation_memories, 1):
        print(f"      {i}. {memory.memory} (source: {memory.metadata.source})")
  
    # Filter file source memories
    file_memories = [m for m in all_memories if m.metadata.source == "file"]
    print(f"    File source memories: {len(file_memories)} items")
    for i, memory in enumerate(file_memories, 1):
        print(f"      {i}. {memory.memory} (source: {memory.metadata.source})")
  
    # 3. Combined filtering
    print("  🔍 Combined filtering:")
    high_conf_file = [m for m in all_memories 
                     if m.metadata.source == "file" and m.metadata.confidence and m.metadata.confidence >= 0.8]
    print(f"    High confidence file memories: {len(high_conf_file)} items")
    for i, memory in enumerate(high_conf_file, 1):
        print(f"      {i}. {memory.memory} (source: {memory.metadata.source}, confidence: {memory.metadata.confidence})")
  
    # 4. Statistics
    print("  📊 Statistics:")
    sources = {}
    confidences = []
  
    for memory in all_memories:
        # Count sources
        source = memory.metadata.source
        sources[source] = sources.get(source, 0) + 1
      
        # Collect confidences
        if memory.metadata.confidence:
            confidences.append(memory.metadata.confidence)
  
    print(f"    Source distribution: {sources}")
    if confidences:
        avg_confidence = sum(confidences) / len(confidences)
        print(f"    Average confidence: {avg_confidence:.2f}")

# 🎯 Demonstrate complete lifecycle management
def demonstrate_lifecycle():
    """
    Demonstrate complete MemCube lifecycle (API version)
    """
  
    manager = MemCubeManager()
  
    print("🚀 Starting MemCube lifecycle demonstration (API version)...\n")
  
    # Step 1: Create MemCube
    print("1️⃣ Creating MemCube")
    cube1 = manager.create_empty_memcube("demo_cube_1")
  
    # Step 2: Add memories
    print("\n2️⃣ Adding memories")
    add_memories_to_cube(cube1, "demo_cube_1")
  
    # Step 3: Save to disk
    print("\n3️⃣ Saving MemCube to disk")
    manager.save_memcube(cube1, "demo_cube_1")
  
    # Step 4: List saved MemCubes
    print("\n4️⃣ Listing saved MemCubes")
    saved_cubes = manager.list_saved_memcubes()
    for cube_info in saved_cubes:
        print(f"  📦 {cube_info['cube_id']} - {cube_info['size']}")
  
    # Step 5: Load from disk
    print("\n5️⃣ Loading MemCube from disk")
    del cube1  # 💡 Delete reference in memory
  
    reloaded_cube = manager.load_memcube("demo_cube_1")
  
    # Step 6: Basic query
    print("\n6️⃣ Basic query")
    basic_query_memcube(reloaded_cube, "reloaded demo_cube_1")
  
    # Step 7: Advanced query (metadata operations)
    print("\n7️⃣ Advanced query (metadata operations)")
    advanced_query_memcube(reloaded_cube, "reloaded demo_cube_1")
  
    # Step 8: Remove MemCube from memory
    print("\n8️⃣ Removing MemCube from memory")
    manager.unload_memcube("demo_cube_1")
  
    # Step 9: Delete local files
    print("\n9️⃣ Deleting local files")
    manager.delete_memcube("demo_cube_1")

if __name__ == "__main__":
    """
    🎯 Main function - run MemCube lifecycle demonstration (API version)
    """
    try:
        demonstrate_lifecycle()
        print("\n🎉 MemCube lifecycle demonstration completed!")
    except Exception as e:
        print(f"\n❌ Error occurred during demonstration: {e}")
        import traceback
        traceback.print_exc()
```

#### Run Example

```bash
# Run MemCube lifecycle demonstration
python memcube_lifecycle_api.py
```

#### Common Problems and Best Practices

**🔧 Best Practices:**

1. **Memory Management**

   ```python
   # ✅ Good practice: Limit number of simultaneously loaded MemCubes
   memory_manager = MemCubeMemoryManager()
   memory_manager.max_active_cubes = 3

   # ❌ Avoid: Loading MemCubes without limit
   # This may cause memory overflow
   ```

2. **Persistence Strategy**

   ```python
   # ✅ Regularly save important data
   if important_changes:
       cube_manager.save_memcube(mem_cube, "important_data")

   # ✅ Use versioned naming
   timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
   cube_manager.save_memcube(mem_cube, f"data_backup_{timestamp}")
   ```

3. **Query Optimization**

   ```python
   # ✅ Set reasonable top_k
   results = mem_cube.text_mem.search(query, top_k=5)  # Usually 5-10 is sufficient

   # ✅ Use metadata filtering to reduce search scope
   filtered_memories = advanced_ops.filter_by_metadata({"category": "important"})
   ```

**🐛 Common Problems:**

**Q1: MemCube save failure?**

```python
# 🔧 Ensure sufficient disk space and write permissions
import shutil
free_space = shutil.disk_usage(".").free / (1024**3)
print(f"Available space: {free_space:.1f} GB")
```

**Q2: Inaccurate query results?**

```python
# 🔧 Check if embedding model is configured correctly
print(f"Embedding model: {mem_cube.text_mem.config.embedder}")

# 🔧 Try different search terms
synonyms = ["important", "key", "core", "main"]
for synonym in synonyms:
    results = mem_cube.text_mem.search(synonym)
```

**Q3: High memory usage?**

```python
# 🔧 Monitor and optimize memory usage
memory_manager.memory_health_check()
memory_manager.unload_cube("unused_cube_id")
gc.collect()
```
